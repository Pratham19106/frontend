import { useState } from "react";
import { motion } from "framer-motion";
import { MessageSquare, Plus, Gavel, Scale, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type ConversationEntry = {
  id: string;
  speaker: "judge" | "lawyer_a" | "lawyer_b";
  content: string;
  timestamp: string;
};

interface ConversationSectionProps {
  caseId: string;
}

const speakerConfig = {
  judge: {
    label: "Judge",
    icon: Gavel,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  lawyer_a: {
    label: "Lawyer (Party A)",
    icon: Scale,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  lawyer_b: {
    label: "Lawyer (Party B)",
    icon: Scale,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
};

export const ConversationSection = ({ caseId: _caseId }: ConversationSectionProps) => {
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [newSpeaker, setNewSpeaker] = useState<"judge" | "lawyer_a" | "lawyer_b">("judge");
  const [newContent, setNewContent] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddEntry = async () => {
    if (!newContent.trim()) return;
    
    setIsAdding(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const newEntry: ConversationEntry = {
      id: crypto.randomUUID(),
      speaker: newSpeaker,
      content: newContent.trim(),
      timestamp: new Date().toISOString(),
    };
    
    setConversations((prev) => [...prev, newEntry]);
    setNewContent("");
    setIsAdding(false);
  };

  const handleDeleteEntry = (id: string) => {
    setConversations((prev) => prev.filter((entry) => entry.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Court Conversation Record</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Record the written conversation between the Judge and Lawyers during the hearing.
      </p>

      {/* Conversation List */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversation entries yet</p>
          </div>
        ) : (
          conversations.map((entry, index) => {
            const config = speakerConfig[entry.speaker];
            const Icon = config.icon;
            
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-3 rounded-lg border",
                  config.bg,
                  config.border
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <Icon className={cn("w-4 h-4 mt-0.5", config.color)} />
                    <div className="flex-1">
                      <p className={cn("text-sm font-medium", config.color)}>
                        {config.label}
                      </p>
                      <p className="text-sm text-foreground mt-1">{entry.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteEntry(entry.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add New Entry */}
      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex gap-3">
          <div className="w-40">
            <Label className="text-xs mb-1">Speaker</Label>
            <Select
              value={newSpeaker}
              onValueChange={(val: "judge" | "lawyer_a" | "lawyer_b") => setNewSpeaker(val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="judge">Judge</SelectItem>
                <SelectItem value="lawyer_a">Lawyer (Party A)</SelectItem>
                <SelectItem value="lawyer_b">Lawyer (Party B)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Textarea
          placeholder="Enter the spoken content..."
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          rows={3}
        />
        
        <Button
          onClick={handleAddEntry}
          disabled={!newContent.trim() || isAdding}
          className="w-full"
        >
          {isAdding ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          Add Entry
        </Button>
      </div>
    </div>
  );
};
