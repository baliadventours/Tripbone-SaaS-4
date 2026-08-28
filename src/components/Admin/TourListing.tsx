import React, { useState, useRef } from 'react';
import { Plus, Copy, Edit2, Trash2, LayoutGrid, List, FileDown, FileUp, Loader2, X, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Tour, Category, UserProfile } from '../../types';
import { cn } from '../../lib/utils';

interface TourListingProps {
  tours: Tour[];
  categories: Category[];
  handleEdit: (tour: Tour) => void;
  handleDelete: (id: string) => Promise<void>;
  handleCloneTour: (tour: Tour) => void;
  handleImportTours?: (importedTours: Partial<Tour>[]) => Promise<number>;
  resetForm: () => void;
  setActiveMenu: (menu: any) => void;
  currentUserProfile?: UserProfile | null;
  userRole?: string;
}

const TourListing = ({
  tours,
  categories,
  handleEdit,
  handleDelete,
  handleCloneTour,
  handleImportTours,
  resetForm,
  setActiveMenu,
  currentUserProfile,
  userRole
}: TourListingProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const role = userRole || currentUserProfile?.role;
  const canDelete = role !== 'staff' && role !== 'agent';

  // State for Import Preview Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importCandidateTours, setImportCandidateTours] = useState<Partial<Tour>[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatusMessage, setImportStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Single tour JSON export
  const handleExportSingleTour = (tour: Tour) => {
    const cleanTour = { ...tour };
    delete (cleanTour as any).id;
    const slug = tour.slug || tour.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanTour, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tour-${slug}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Export all tours JSON
  const handleExportAllTours = () => {
    if (!tours || tours.length === 0) {
      alert("No tours available to export.");
      return;
    }
    const cleanTours = tours.map(tour => {
      const { id, ...rest } = tour as any;
      return rest;
    });
    const dateStr = new Date().toISOString().split('T')[0];
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cleanTours, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tours-export-${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handle file select for import
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportStatusMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonContent = event.target?.result as string;
        const parsed = JSON.parse(jsonContent);

        let parsedArray: any[] = [];
        if (Array.isArray(parsed)) {
          parsedArray = parsed;
        } else if (parsed && typeof parsed === 'object') {
          parsedArray = [parsed];
        }

        // Validate basic tour fields
        const validTours: Partial<Tour>[] = [];
        for (const item of parsedArray) {
          if (item && typeof item === 'object' && item.title) {
            validTours.push(item);
          }
        }

        if (validTours.length === 0) {
          alert("No valid tour objects found in the JSON file. Ensure items have a 'title' property.");
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        setImportCandidateTours(validTours);
        setImportModalOpen(true);
      } catch (err) {
        console.error("Failed to parse JSON file:", err);
        alert("Invalid JSON file format. Please check your file and try again.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!handleImportTours || importCandidateTours.length === 0) return;
    setIsImporting(true);
    try {
      const count = await handleImportTours(importCandidateTours);
      if (count > 0) {
        setImportStatusMessage({ type: 'success', text: `Successfully imported ${count} tour(s)!` });
        setTimeout(() => {
          setImportModalOpen(false);
          setImportCandidateTours([]);
          setImportStatusMessage(null);
        }, 1500);
      } else {
        setImportStatusMessage({ type: 'error', text: 'No tours were imported. Please check permissions or quota.' });
      }
    } catch (err) {
      console.error(err);
      setImportStatusMessage({ type: 'error', text: 'Failed to import tours. Please try again.' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Tour Catalog</h1>
          <p className="text-gray-500 font-medium">Manage and monitor all your live adventures.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-gray-100 p-1 rounded-[10px] flex gap-1 mr-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-[7px] transition-all",
                viewMode === 'grid' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-[7px] transition-all",
                viewMode === 'list' ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          {/* Export JSON Button */}
          <button 
            onClick={handleExportAllTours}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-[10px] font-black text-xs flex items-center gap-2 transition-all shadow-sm"
            title="Export all listed tours as JSON"
          >
            <FileDown className="h-4 w-4 text-gray-600" /> Export JSON
          </button>

          {/* Import JSON Button */}
          <label className="cursor-pointer bg-orange-50 hover:bg-orange-100 text-primary px-4 py-3 rounded-[10px] font-black text-xs flex items-center gap-2 transition-all border border-orange-200/60 shadow-sm">
            <FileUp className="h-4 w-4 text-primary" /> Import JSON
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json,application/json" 
              onChange={handleFileSelect} 
              className="hidden" 
            />
          </label>

          {/* Add New Tour Button */}
          <button 
            onClick={() => { resetForm(); setActiveMenu('tours'); }} 
            className="bg-primary text-white px-5 py-3 rounded-[10px] font-black text-xs flex items-center gap-2 shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all"
          >
            <Plus className="h-4 w-4" /> Add New Tour
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tours.map(tour => (
            <div key={tour.id} className="group relative overflow-hidden rounded-[10px] border border-gray-100 bg-white transition-all hover:shadow-2xl">
              <div className="aspect-[4/3] w-full overflow-hidden relative">
                <img 
                  src={tour.gallery?.[0] || "https://picsum.photos/seed/placeholder/400/300"} 
                  alt="" 
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  referrerPolicy="no-referrer" 
                />
                <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <button 
                    onClick={() => handleExportSingleTour(tour)} 
                    className="p-2.5 bg-white/90 backdrop-blur rounded-[10px] text-gray-700 shadow-xl hover:bg-gray-800 hover:text-white transition-all" 
                    title="Export JSON"
                  >
                    <FileDown className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleCloneTour(tour)} 
                    className="p-2.5 bg-white/90 backdrop-blur rounded-[10px] text-primary shadow-xl hover:bg-primary hover:text-white transition-all" 
                    title="Clone Tour"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleEdit(tour)} 
                    className="p-2.5 bg-white/90 backdrop-blur rounded-[10px] text-blue-600 shadow-xl hover:bg-blue-600 hover:text-white transition-all" 
                    title="Edit Tour"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  {canDelete && (
                    <button 
                      onClick={() => handleDelete(tour.id)} 
                      className="p-2.5 bg-white/90 backdrop-blur rounded-[10px] text-red-600 shadow-xl hover:bg-red-600 hover:text-white transition-all" 
                      title="Delete Tour"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-orange-50 text-primary text-[10px] font-black rounded-full">
                    {categories.find(c => c.id === tour.categoryId)?.name || 'General'}
                  </span>
                  {tour.status && (
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-widest",
                      tour.status === 'published' ? "bg-orange-50 text-primary" :
                      tour.status === 'pending' ? "bg-amber-50 text-amber-600" :
                      tour.status === 'draft' ? "bg-gray-100 text-gray-500" :
                      "bg-red-50 text-red-600"
                    )}>
                      {tour.status}
                    </span>
                  )}
                </div>
                <h3 className="font-extrabold text-gray-900 text-lg group-hover:text-primary transition-colors">{tour.title}</h3>
                {tour.supplierName && (
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Vendor: {tour.supplierName}</p>
                )}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-gray-400 tracking-tighter">Starts From</span>
                     <span className="text-xl font-black text-primary tracking-tight">${tour.discountPrice || tour.regularPrice}</span>
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter block">Duration</span>
                     <span className="text-sm font-black text-gray-900">{tour.duration}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[10px] border border-gray-100 overflow-hidden shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tour Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Vendor</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Price</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tours.map(tour => (
                <tr key={tour.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={tour.gallery?.[0] || "https://picsum.photos/seed/placeholder/400/300"} 
                          className="h-full w-full object-cover"
                          alt=""
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{tour.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{tour.duration}</p>
                          {tour.cutOffHours !== undefined && tour.cutOffHours > 0 ? (
                            <span className="text-[9px] font-extrabold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100 flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" /> {tour.cutOffHours}h cut-off
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              Instant booking
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-gray-600 px-3 py-1 bg-gray-100 rounded-full">
                      {categories.find(c => c.id === tour.categoryId)?.name || 'General'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest",
                      tour.status === 'published' ? "bg-orange-50 text-primary" :
                      tour.status === 'pending' ? "bg-amber-50 text-amber-600" :
                      tour.status === 'draft' ? "bg-gray-100 text-gray-500" :
                      "bg-red-50 text-red-600"
                    )}>
                      {tour.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    {tour.supplierName || '-'}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="text-sm font-black text-primary">${tour.discountPrice || tour.regularPrice}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                       <button onClick={() => handleExportSingleTour(tour)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all" title="Export JSON"><FileDown className="h-4 w-4" /></button>
                       <button onClick={() => handleCloneTour(tour)} className="p-2 text-primary hover:bg-orange-50 rounded-lg transition-all" title="Clone"><Copy className="h-4 w-4" /></button>
                       <button onClick={() => handleEdit(tour)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit"><Edit2 className="h-4 w-4" /></button>
                       {canDelete && (
                         <button onClick={() => handleDelete(tour.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"><Trash2 className="h-4 w-4" /></button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import Preview Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Import Tours from JSON</h2>
                <p className="text-xs text-gray-500 font-medium mt-0.5">File: <span className="font-bold text-gray-800">{importFileName}</span></p>
              </div>
              <button 
                onClick={() => { setImportModalOpen(false); setImportCandidateTours([]); }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {importStatusMessage && (
              <div className={cn(
                "p-4 rounded-xl flex items-center gap-3 text-xs font-bold",
                importStatusMessage.type === 'success' ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-red-50 text-red-800 border border-red-200"
              )}>
                {importStatusMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-600" /> : <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />}
                <span>{importStatusMessage.text}</span>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                Tours Ready to Import ({importCandidateTours.length})
              </p>
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 rounded-xl border border-gray-100 bg-gray-50/50 p-2 space-y-1">
                {importCandidateTours.map((t, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-lg border border-gray-100 flex items-center justify-between text-xs font-medium">
                    <div>
                      <p className="font-bold text-gray-900">{t.title}</p>
                      <p className="text-[10px] text-gray-500">{t.duration || 'Full Day'} • Price: ${t.regularPrice || 0} • Packages: {t.packages?.length || 0}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-orange-50 text-primary font-extrabold text-[10px] rounded-md">Ready</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => { setImportModalOpen(false); setImportCandidateTours([]); }}
                disabled={isImporting}
                className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={isImporting}
                className="bg-primary text-white px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <FileUp className="h-4 w-4" /> Import {importCandidateTours.length} Tour(s)
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourListing;
