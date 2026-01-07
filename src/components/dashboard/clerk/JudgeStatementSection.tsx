import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Play, Pause, RotateCcw, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";


interface JudgeStatementSectionProps {
  caseId: string;
}

export const JudgeStatementSection = ({ caseId: _caseId }: JudgeStatementSectionProps) => {
  const [statementText, setStatementText] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [charIndex, setCharIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!isTyping || isPaused || charIndex >= statementText.length) {
      if (charIndex >= statementText.length && isTyping) {
        setIsTyping(false);
      }
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayedText(statementText.slice(0, charIndex + 1));
      setCharIndex((prev) => prev + 1);
    }, 50); // Typing speed

    return () => clearTimeout(timeout);
  }, [isTyping, isPaused, charIndex, statementText]);

  const handleStartTyping = () => {
    if (charIndex >= statementText.length) {
      // Reset for new text
      setCharIndex(0);
      setDisplayedText("");
    }
    setIsTyping(true);
    setIsPaused(false);
    setIsSaved(false);
  };

  const handlePauseTyping = () => {
    setIsPaused(true);
  };

  const handleResumeTyping = () => {
    setIsPaused(false);
  };

  const handleReset = () => {
    setIsTyping(false);
    setIsPaused(false);
    setCharIndex(0);
    setDisplayedText("");
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (!displayedText.trim()) return;
    
    setIsSaving(true);
    
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    setIsSaved(true);
  };

  const isComplete = charIndex >= statementText.length && statementText.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-amber-500" />
        <h3 className="font-semibold">Judge Statement & Decision</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Enter the Judge's statement or decision. Use the typewriter effect to display it formally.
      </p>

      {/* Input Section */}
      <div className="space-y-3">
        <Textarea
          placeholder="Enter the judge's statement or decision here..."
          value={statementText}
          onChange={(e) => {
            setStatementText(e.target.value);
            handleReset();
          }}
          rows={5}
          className="font-serif"
        />
        
        <div className="flex gap-2 flex-wrap">
          {!isTyping && (
            <Button onClick={handleStartTyping} disabled={!statementText.trim()}>
              <Play className="w-4 h-4 mr-2" />
              Start Typewriter
            </Button>
          )}
          
          {isTyping && !isPaused && (
            <Button onClick={handlePauseTyping} variant="outline">
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          )}
          
          {isTyping && isPaused && (
            <Button onClick={handleResumeTyping} variant="outline">
              <Play className="w-4 h-4 mr-2" />
              Resume
            </Button>
          )}
          
          {(isTyping || displayedText) && (
            <Button onClick={handleReset} variant="ghost">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Typewriter Display */}
      {(displayedText || isTyping) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="bg-amber-50/5 border border-amber-500/20 rounded-lg p-6">
            <div className="text-center mb-4">
              <p className="text-xs uppercase tracking-widest text-amber-500/70">
                Official Statement
              </p>
            </div>
            
            <div className="relative min-h-32">
              <p className="font-serif text-lg leading-relaxed whitespace-pre-wrap">
                {displayedText}
                {isTyping && !isPaused && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="inline-block w-0.5 h-5 bg-amber-500 ml-0.5 align-middle"
                  />
                )}
              </p>
            </div>
            
            {isComplete && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 pt-4 border-t border-amber-500/20 flex justify-between items-center"
              >
                <p className="text-xs text-muted-foreground">
                  Statement complete • {displayedText.split(" ").length} words
                </p>
                <Button
                  onClick={handleSave}
                  disabled={isSaving || isSaved}
                  size="sm"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : isSaved ? (
                    <>✓ Saved</>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Statement
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};
