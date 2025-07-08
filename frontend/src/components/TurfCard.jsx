import { Star } from "lucide-react";

const TurfCard = ({ 
  turf, 
  selectedSport, 
  nearestSwitch, 
  checkInSlot, 
  checkOutSlot,
  availableSlots,
  bookedSlots,
  onClick,
  sports,
  
}) => {

  const sport = sports.find(s => s.id === selectedSport);
  
  return (
    <div
      className={`bg-gray-800/50 border rounded-xl overflow-hidden transition-colors cursor-pointer group 
      }`}
      onClick={onClick}
    >
      <div className="relative">
        <img
          src={turf.images[0]}
          alt={turf.name}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex justify-between items-end">
            <h3 className="font-bold text-xl">{turf.name}</h3>
            {nearestSwitch && (
              <div className="bg-lime-500/10 text-lime-400 px-2 py-1 rounded-full text-xs font-bold">
                {turf.distance.toFixed(1)} km
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full flex items-center">
          <Star size={14} className="text-yellow-400 fill-yellow-400 mr-1" />
          <span className="text-sm font-medium">{turf.rating}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1">
            {sport && (
              <div className={`${sport.color} p-1 rounded-lg`}>
                <img src={sport.icon} alt={sport.name} className="w-5 h-5 object-contain" />
              </div>
            )}
            <span className="text-xs uppercase font-bold">
              {selectedSport 
                ? turf.sportsAvailable.find(s => s === selectedSport)
                : turf.sportsAvailable.join(', ')}
            </span>
          </div>
          <div className="text-lime-400 font-bold">{turf.price}</div>
        </div>

        <p className="text-gray-400 text-sm mb-3">{turf.address}</p>

        <div className="flex flex-wrap gap-2">
          {availableSlots.slice(0, 3).map((slot, i) => {
            const isSelected = availableSlots.includes(checkInSlot)
           
            return (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded ${
                  isSelected
                    ? "bg-lime-500/20 text-lime-400 border border-lime-500/50"
                    : "bg-gray-700/50 text-gray-300"
                }`}
              >
                {slot}
              </span>
            );
          })}
          {availableSlots.length > 3 && (
            <span className="bg-gray-700/50 text-xs px-2 py-1 rounded">
              +{availableSlots.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TurfCard;