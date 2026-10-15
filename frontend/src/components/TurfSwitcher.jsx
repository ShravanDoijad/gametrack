import { SquareStack, ChevronDown } from 'lucide-react';
import { useContext, useState } from 'react';
import { BookContext } from '../constexts/bookContext';

const TurfSwitcher = () => {
  const { turfs, selectedTurfId, setSelectedTurfId } = useContext(BookContext);
  const [open, setOpen] = useState(false);

 
  return (
    <>
      {/* Bottom Icon Button */}
      <div className="z-50 rounded-2xl border border-white/10">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Switch active turf"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-900 text-white shadow-xl transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400"
        >
          <SquareStack size={20} />
        </button>
      </div>

      {/* Bottom Sheet */}
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="switch-turf-title" className="max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-900 p-4 shadow-2xl sm:rounded-3xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 id="switch-turf-title" className="text-lg font-semibold text-white">Select a Turf</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close turf selection"
                className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition hover:bg-white/10 hover:text-white"
              >
                <ChevronDown size={20} className="rotate-180" />
              </button>
            </div>

            <div className="space-y-3">
              {turfs.map((turf) => (
                <button
                  type="button"
                  key={turf._id}
                  onClick={() => {
                    setSelectedTurfId(turf._id);
                    setOpen(false);
                  }}
                  className={`flex min-h-14 w-full items-center gap-4 rounded-xl p-3 text-left transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 ${
                    turf._id === selectedTurfId ? 'bg-gray-800 border border-amber-500' : ''
                  }`}
                >
                  <img
                    src={turf.images?.[0] || '/placeholder.jpg'}
                    alt={turf.name}
                    className="h-12 w-12 shrink-0 rounded-lg object-cover"
                  />
                  <span className="text-white font-medium truncate">{turf.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TurfSwitcher;
