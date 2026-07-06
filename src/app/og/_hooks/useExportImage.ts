import { useRef, useState } from "react";

export const useExportImage = () => {
  const exportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleDownload = async () => {
    if (!exportRef.current || isExporting) return;

    try {
      setIsExporting(true);

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const { toPng } = await import("html-to-image");

      const dataUrl = await toPng(exportRef.current, {
        cacheBust: true,
        pixelRatio: 2, // for high resolution
        backgroundColor: "#ffffff",
        width: 1200,
        height: 630,
      });

      const link = document.createElement("a");
      link.download = "dowin-og-image.png";
      link.href = dataUrl;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export image", err);
      alert("이미지 저장에 실패했습니다.");
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportRef,
    isExporting,
    handleDownload,
  };
};
