import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Folder, Scale, FileText, ChevronRight, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Simplified types matching current database schema
type Case = {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  status: string;
  case_type: string;
  created_at: string;
  court_name: string | null;
};

const CaseBlocks = () => {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all cases (sections table doesn't exist yet)
        const { data: casesData, error: casesError } = await supabase
          .from('cases')
          .select('id, case_number, title, description, status, case_type, created_at, court_name')
          .order('created_at', { ascending: false });

        if (casesError) {
          console.error('Error fetching cases:', casesError);
          toast.error('Failed to load cases');
          return;
        }

        setCases(casesData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sectionId]);

  const canCreateCase = profile?.role_category === 'judiciary' || profile?.role_category === 'legal_practitioner';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'closed':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'hearing':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'verdict_pending':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/courts')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Scale className="w-4 h-4" />
                <span>Case Repository</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">All Cases</h1>
            </div>
            {canCreateCase && (
              <Button onClick={() => navigate('/dashboard')}>
                <Plus className="w-4 h-4 mr-2" />
                New Case
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button
            onClick={() => navigate('/courts')}
            className="hover:text-foreground transition-colors"
          >
            Courts
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Cases</span>
        </nav>

        {/* Cases Grid */}
        {cases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((caseItem, index) => (
              <motion.div
                key={caseItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/cases/${caseItem.id}`)}
                className={cn(
                  "glass-card p-5 cursor-pointer transition-all duration-300",
                  "hover:scale-[1.02] hover:shadow-lg hover:border-primary/30"
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant="outline" className={getStatusColor(caseItem.status)}>
                    {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1).replace('_', ' ')}
                  </Badge>
                </div>

                <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                  {caseItem.title}
                </h3>
                <p className="text-sm font-mono text-muted-foreground mb-3">
                  {caseItem.case_number}
                </p>

                {caseItem.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {caseItem.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Gavel className="w-3.5 h-3.5 text-amber-400" />
                    <span className="truncate">
                      Type: <span className="font-medium text-foreground capitalize">{caseItem.case_type}</span>
                    </span>
                  </div>
                  {caseItem.court_name && (
                    <div className="text-xs text-muted-foreground">
                      Court: {caseItem.court_name}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(caseItem.created_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Folder className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Cases Yet</h3>
            <p className="text-muted-foreground mb-6">
              No cases have been registered. Create the first one to get started.
            </p>
            {canCreateCase && (
              <Button onClick={() => navigate('/dashboard')}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Case
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default CaseBlocks;
