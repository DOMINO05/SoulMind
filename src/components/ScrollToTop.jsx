import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Azonnali ugrás a tetejére (0, 0 koordináta)
    window.scrollTo(0, 0);
  }, [pathname]); // Minden alkalommal lefut, ha változik az URL (pathname)

  return null; // Ez a komponens nem renderel semmit a képernyőre
};

export default ScrollToTop;