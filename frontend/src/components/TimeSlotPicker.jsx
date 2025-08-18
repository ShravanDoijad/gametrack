import {ChevronLeft} from 'lucide-react'

const TimeSlotPicker = ({
  mode,
  slots,
  selectedSlot,
  onSelect,
  onBack,
  onClose,
}) => {
  console.log("selectedSlot", selectedSlot)
  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-700 flex items-center">
          {mode === "check-out" && (
            <button
              onClick={onBack}
              className="mr-2 text-gray-400 hover:text-white"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <h3 className="text-lg font-semibold flex-1 text-center">
            {mode === "check-in" ? "Select Check-in Time" : "Select Duration"}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {slots.map((slot, index) => (
            <button
            
              key={index}
              onClick={() => onSelect(mode === "check-in" ? slot.display : slot)}
              className={`p-3 rounded-lg border text-sm transition-all ${
                selectedSlot === slot
                  ? "bg-lime-500/20 border-lime-500"
                  : "bg-gray-700/30 border-gray-600 hover:bg-gray-700/50"
              }`}
            >
              {mode === "check-in" ? (
                slot.display
              ) : (
                <>
                  {slot} ({index + 1} hr{index > 0 ? "s" : ""})
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeSlotPicker;