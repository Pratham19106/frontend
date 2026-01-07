import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, ChevronRight, ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';

// Since sections table doesn't exist, show cases instead
type Case = {
  id: string;
  case_number: string;
  title: string;
  status: string;
  case_type: string;
};

const Sections = () => {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    // Fetch all cases (sections table doesn't exist)
    const { data: casesData, error } = await supabase
      .from('cases')
      .select('id, case_number, title, status, case_type')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching cases:', error);
    } else {
      setCases(casesData || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [courtId]);

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
            <Button variant="ghost" size="icon" onClick={() => navigate('/courts')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">All Cases</h1>
              <p className="text-sm text-muted-foreground">Browse registered cases</p>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => navigate('/courts')} className="hover:text-foreground">
            Courts
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Cases</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Cases</h2>
            <p className="text-muted-foreground">
              Select a case to view details
            </p>
          </div>

          {cases.length === 0 ? (
            <div className="text-center py-16">
              <Layers className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Cases Yet</h3>
              <p className="text-muted-foreground mb-6">
                No cases have been registered. Go to the dashboard to register a case.
              </p>
              <Button onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cases.map((caseItem, index) => (
                <motion.button
                  key={caseItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                  className="glass-card-hover p-6 text-left group"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1">
                    {caseItem.title}
                  </h3>
                  
                  <p className="text-sm font-mono text-muted-foreground mb-3">
                    {caseItem.case_number}
                  </p>

                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusColor(caseItem.status)}>
                      {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {caseItem.case_type}
                    </Badge>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Sections;
