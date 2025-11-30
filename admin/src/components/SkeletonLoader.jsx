import { motion } from "framer-motion";


const SkeletonLoader = () => {
  // Animation variants
  const skeletonVariants = {
    initial: { opacity: 0.5 },
    animate: { 
      opacity: 0.8,
      transition: {
        repeat: Infinity,
        repeatType: "reverse",
        duration: 1.5
      }
    }
  };

  return (
    <div className="w-full min-h-screen text-white p-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <motion.div 
            variants={skeletonVariants}
            initial="initial"
            animate="animate"
            className="h-8 w-64 bg-gray-700 rounded mb-2"
          />
          <motion.div 
            variants={skeletonVariants}
            initial="initial"
            animate="animate"
            className="h-4 w-48 bg-gray-700 rounded"
          />
        </div>
        <motion.div 
          variants={skeletonVariants}
          initial="initial"
          animate="animate"
          className="w-10 h-10 bg-gray-700 rounded-full"
        />
      </div>

      {/* Main Image Skeleton */}
      <motion.div
        variants={skeletonVariants}
        initial="initial"
        animate="animate"
        className="w-full h-72 bg-gray-700 rounded-2xl mb-6"
      />

      {/* Rates Section Skeleton */}
      <motion.div 
        variants={skeletonVariants}
        initial="initial"
        animate="animate"
        className="h-40 bg-gray-700 rounded-xl mb-6 p-4"
      >
        <div className="flex justify-between mb-4">
          <div className="h-6 w-32 bg-gray-600 rounded" />
          <div className="h-8 w-28 bg-gray-600 rounded" />
        </div>
        <div className="flex gap-4">
          <div className="flex-1 h-20 bg-gray-600 rounded-lg" />
          <div className="flex-1 h-20 bg-gray-600 rounded-lg" />
        </div>
      </motion.div>

      {/* Sports Section Skeleton */}
      <div className="mb-8">
        <motion.div 
          variants={skeletonVariants}
          initial="initial"
          animate="animate"
          className="h-6 w-40 bg-gray-700 rounded mb-4"
        />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((item) => (
            <motion.div
              key={item}
              variants={skeletonVariants}
              initial="initial"
              animate="animate"
              className="h-24 bg-gray-700 rounded-xl"
            />
          ))}
        </div>
      </div>

      {/* Facilities Section Skeleton */}
      <div className="mb-8">
        <motion.div 
          variants={skeletonVariants}
          initial="initial"
          animate="animate"
          className="h-6 w-40 bg-gray-700 rounded mb-4"
        />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((item) => (
            <motion.div
              key={item}
              variants={skeletonVariants}
              initial="initial"
              animate="animate"
              className="h-14 bg-gray-700 rounded-lg"
            />
          ))}
        </div>
      </div>

      {/* Bottom Action Bar Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-4">
        <div className="flex justify-between max-w-md mx-auto w-full">
          <motion.div 
            variants={skeletonVariants}
            initial="initial"
            animate="animate"
            className="h-12 w-40 bg-gray-700 rounded-xl"
          />
          <motion.div 
            variants={skeletonVariants}
            initial="initial"
            animate="animate"
            className="h-12 w-40 bg-gray-700 rounded-xl"
          />
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoader;