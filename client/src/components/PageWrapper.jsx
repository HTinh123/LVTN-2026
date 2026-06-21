import { motion } from "framer-motion";

const PageWrapper = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}    // Lúc mới vào: mờ và hơi thấp xuống
      animate={{ opacity: 1, y: 0 }}     // Lúc hiện ra: rõ nét và bay lên vị trí chuẩn
      exit={{ opacity: 0, y: -20 }}      // Lúc biến mất: mờ và bay lên trên
      transition={{ duration: 0.4, ease: "easeOut" }} // Tốc độ 0.4 giây
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper; 