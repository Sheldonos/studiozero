import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AssetUpload from "@/components/AssetUpload";
import { ArrowLeft, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

export default function Assets() {
  const [showUpload, setShowUpload] = useState(false);
  const utils = trpc.useUtils();
  
  const { data: assets, isLoading } = trpc.assets.list.useQuery();
  
  const deleteMutation = trpc.assets.delete.useMutation({
    onSuccess: () => {
      toast.success("Asset deleted");
      utils.assets.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this asset?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const getAssetTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      character_reference: "Character",
      location_reference: "Location",
      style_reference: "Style",
      prop: "Prop",
    };
    return variants[type] || type;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Custom Assets</h1>
              <p className="text-muted-foreground">
                Upload reference images for characters, locations, and styles
              </p>
            </div>
          </div>
          
          <Button onClick={() => setShowUpload(!showUpload)}>
            {showUpload ? "Hide Upload" : "Upload Asset"}
          </Button>
        </div>

        {showUpload && (
          <div className="mb-8">
            <AssetUpload
              onUploadComplete={() => {
                setShowUpload(false);
                utils.assets.list.invalidate();
              }}
            />
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading assets...</p>
          </div>
        ) : assets && assets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assets.map((asset) => (
              <Card key={asset.id} className="overflow-hidden">
                <div className="aspect-video relative bg-muted">
                  <img
                    src={asset.assetUrl || ""}
                    alt={asset.assetName}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-2 left-2">
                    {getAssetTypeBadge(asset.assetType)}
                  </Badge>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{asset.assetName}</h3>
                  {asset.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {asset.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(asset.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No assets yet</h3>
            <p className="text-muted-foreground mb-6">
              Upload custom visual references to use in your film generation
            </p>
            <Button onClick={() => setShowUpload(true)}>Upload Your First Asset</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
