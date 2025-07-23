import { SquareStack, ChevronDown } from 'lucide-react';
import { useContext, useState } from 'react';
import { BookContext } from '../constexts/bookContext';

const TurfSwitcher = () => {
  const { turfs, selectedTurfId, setSelectedTurfId } = useContext(BookContext);
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Bottom Icon Button */}
      <div className=" z-50 border-l-2 border-t-2 rounded-2xl border-lime-200">
        <button
          onClick={() => setOpen(true)}
          className="p-3 bg-gray-900 text-white rounded-full shadow-xl hover:bg-gray-700 transition-all"
        >
          <SquareStack size={24} />
        </button>
      </div>

      {/* Bottom Sheet */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40">
          <div className="w-full max-h-[50vh] overflow-y-auto bg-gray-900 rounded-t-2xl p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Select a Turf</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <ChevronDown size={20} className="rotate-180" />
              </button>
            </div>

            <div className="space-y-3">
              {turfs.map((turf) => (
                <div
                  key={turf._id}
                  onClick={() => {
                    setSelectedTurfId(turf._id);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition hover:bg-gray-800 ${
                    turf._id === selectedTurfId ? 'bg-gray-800 border border-amber-500' : ''
                  }`}
                >
                  <img
                    src={turf.images[0] || '/placeholder.jpg'}
                    alt={turf.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                  <span className="text-white font-medium truncate">{turf.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TurfSwitcher;
