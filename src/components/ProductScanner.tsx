import { useState, useRef, useCallback } from "react";
import { Camera, ScanBarcode, Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProductScannerProps {
  onProductIdentified: (productName: string) => void;
  isLoading: boolean;
}

const ProductScanner = ({ onProductIdentified, isLoading }: ProductScannerProps) => {
  const [mode, setMode] = useState<"idle" | "barcode" | "photo" | "identifying">("idle");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const stopCamera = useCallback(() => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().catch(() => {});
      } catch {}
      scannerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const closeDialog = useCallback(() => {
    stopCamera();
    setDialogOpen(false);
    setMode("idle");
    setPreview(null);
  }, [stopCamera]);

  const identifyFromImage = async (base64: string) => {
    setMode("identifying");
    try {
      const { data, error } = await supabase.functions.invoke("identify-product", {
        body: { image_base64: base64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const productName = data.product_name;
      toast({
        title: "Product identified!",
        description: `Detected: ${productName} (${data.confidence} confidence)`,
      });
      closeDialog();
      onProductIdentified(productName);
    } catch (err: any) {
      console.error("Image identification error:", err);
      toast({
        title: "Could not identify product",
        description: err.message || "Try a clearer photo or type the product name.",
        variant: "destructive",
      });
      setMode("idle");
    }
  };

  const identifyFromBarcode = async (barcode: string) => {
    setMode("identifying");
    try {
      const { data, error } = await supabase.functions.invoke("identify-product", {
        body: { barcode },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const productName = data.product_name;
      toast({
        title: "Barcode matched!",
        description: `Detected: ${productName} (${data.confidence} confidence)`,
      });
      closeDialog();
      onProductIdentified(productName);
    } catch (err: any) {
      console.error("Barcode identification error:", err);
      toast({
        title: "Could not identify barcode",
        description: err.message || "Try scanning again or type the product name.",
        variant: "destructive",
      });
      setMode("idle");
    }
  };

  const startBarcodeScanner = async () => {
    setMode("barcode");
    setDialogOpen(true);

    // Dynamic import to avoid SSR issues
    setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scanner = new Html5Qrcode("barcode-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            scanner.stop().catch(() => {});
            scannerRef.current = null;
            identifyFromBarcode(decodedText);
          },
          () => {} // ignore scan failures
        );
      } catch (err: any) {
        console.error("Barcode scanner error:", err);
        toast({
          title: "Camera access denied",
          description: "Please allow camera access to scan barcodes.",
          variant: "destructive",
        });
        setMode("idle");
      }
    }, 300);
  };

  const startPhotoCapture = () => {
    // Only trigger file picker; dialog opens after file is selected
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      setMode("photo");
      setDialogOpen(true);

      // Extract base64 without data URL prefix
      const base64 = result.split(",")[1];
      identifyFromImage(base64);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={startBarcodeScanner}
          disabled={isLoading || mode === "identifying"}
          className="h-14 w-14 rounded-xl border-border bg-card hover:bg-accent hover:border-primary/50 transition-all"
          title="Scan barcode"
        >
          <ScanBarcode className="h-5 w-5 text-muted-foreground" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={startPhotoCapture}
          disabled={isLoading || mode === "identifying"}
          className="h-14 w-14 rounded-xl border-border bg-card hover:bg-accent hover:border-primary/50 transition-all"
          title="Snap a photo"
        >
          <Camera className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-orbitron text-foreground">
              {mode === "barcode" && "Scan Barcode"}
              {mode === "photo" && "Captured Photo"}
              {mode === "identifying" && "Identifying..."}
              {mode === "idle" && "Scanner"}
            </DialogTitle>
            <DialogDescription className="font-mono text-muted-foreground text-xs">
              {mode === "barcode" && "Point your camera at a barcode"}
              {mode === "identifying" && "AI is analyzing the product..."}
            </DialogDescription>
          </DialogHeader>

          {mode === "barcode" && (
            <div className="relative rounded-lg overflow-hidden bg-background">
              <div id="barcode-reader" className="w-full" />
            </div>
          )}

          {(mode === "photo" || mode === "identifying") && preview && (
            <div className="relative rounded-lg overflow-hidden bg-background">
              <img src={preview} alt="Product" className="w-full max-h-64 object-contain" />
              {mode === "identifying" && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="font-mono text-xs text-muted-foreground">Analyzing with AI...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === "identifying" && !preview && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="font-mono text-xs text-muted-foreground">Looking up barcode...</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductScanner;
