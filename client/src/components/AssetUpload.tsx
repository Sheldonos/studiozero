import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface AssetUploadProps {
  projectId?: number;
  onUploadComplete?: () => void;
}

export default function AssetUpload({ projectId, onUploadComplete }: AssetUploadProps) {
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState<"character_reference" | "location_reference" | "style_reference" | "prop">("character_reference");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadMutation = trpc.assets.upload.useMutation({
    onSuccess: () => {
      toast.success("Asset uploaded successfully!");
      // Reset form
      setAssetName("");
      setDescription("");
      setSelectedFile(null);
      setPreviewUrl(null);
      onUploadComplete?.();
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !assetName) {
      toast.error("Please provide a name and select a file");
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      
      await uploadMutation.mutateAsync({
        assetType,
        assetName,
        assetData: base64!,
        projectId,
        description: description || undefined,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Upload Custom Asset</h3>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="assetName">Asset Name *</Label>
          <Input
            id="assetName"
            value={assetName}
            onChange={(e) => setAssetName(e.target.value)}
            placeholder="e.g., Rocky Character Reference"
          />
        </div>

        <div>
          <Label htmlFor="assetType">Asset Type *</Label>
          <Select value={assetType} onValueChange={(value: any) => setAssetType(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="character_reference">Character Reference</SelectItem>
              <SelectItem value="location_reference">Location Reference</SelectItem>
              <SelectItem value="style_reference">Style Reference</SelectItem>
              <SelectItem value="prop">Prop</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this asset and how it should be used..."
            rows={3}
          />
        </div>

        <div>
          <Label>Image File *</Label>
          <div className="mt-2">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-12 h-12 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP (MAX. 10MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>
            )}
          </div>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !assetName || uploadMutation.isPending}
          className="w-full"
        >
          {uploadMutation.isPending ? (
            "Uploading..."
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Asset
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
