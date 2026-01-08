import { useState } from "react";
import {
  Archive,
  Search,
  Filter,
  Upload,
  FileText,
  Image,
  Video,
  AudioLines,
  File,
  Lock,
  FolderOpen,
  Grid3X3,
  List,
} from "lucide-react";
import { NyaySutraSidebar } from "@/components/dashboard/NyaySutraSidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Evidence table doesn't exist yet - show placeholder UI
const EvidenceVault = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "document":
        return <FileText className="h-5 w-5 text-blue-400" />;
      case "video":
        return <Video className="h-5 w-5 text-purple-400" />;
      case "audio":
        return <AudioLines className="h-5 w-5 text-amber-400" />;
      case "image":
        return <Image className="h-5 w-5 text-emerald-400" />;
      default:
        return <File className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <NyaySutraSidebar />

      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Archive className="h-8 w-8 text-primary" />
              Evidence Vault
            </h1>
            <p className="text-muted-foreground mt-1">Secure repository for all case evidence</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90">
            <Upload className="h-4 w-4 mr-2" />
            Upload Evidence
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card className="card-glass border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Total Files</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10">
                <FileText className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Documents</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/10">
                <Video className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Media Files</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-glass border-border/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-500/10">
                <Lock className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-sm text-muted-foreground">Sealed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="card-glass border-border/50 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, case number, or file name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted/50 border-border"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-48 bg-muted/50 border-border">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center border border-border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(viewMode === "grid" && "bg-muted")}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(viewMode === "list" && "bg-muted")}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        <Card className="card-glass border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Archive className="h-16 w-16 mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Evidence Vault Coming Soon</h3>
            <p className="text-center max-w-md">
              The evidence management system is under development. 
              Once the evidence table is created, you'll be able to upload, 
              view, and seal evidence securely.
            </p>
            <div className="flex items-center gap-4 mt-6">
              {getCategoryIcon("document")}
              {getCategoryIcon("image")}
              {getCategoryIcon("video")}
              {getCategoryIcon("audio")}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default EvidenceVault;
