import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, MapPin, ChevronRight, LogOut, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Use court_name from cases table to display unique courts
type CourtInfo = {
  name: string;
  caseCount: number;
};

const Courts = () => {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [courts, setCourts] = useState<CourtInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCourts = async () => {
    // Get unique court names from cases table
    const { data, error } = await supabase
      .from('cases')
      .select('court_name');

    if (error) {
      console.error('Error fetching courts:', error);
    } else {
      // Group by court_name and count
      const courtMap = new Map<string, number>();
      (data || []).forEach(c => {
        const name = c.court_name || 'Unassigned Court';
        courtMap.set(name, (courtMap.get(name) || 0) + 1);
      });

      const uniqueCourts: CourtInfo[] = Array.from(courtMap.entries()).map(([name, count]) => ({
        name,
        caseCount: count,
      }));

      setCourts(uniqueCourts);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const getRoleBadge = () => {
    if (!profile) return null;
    
    const roleStyles: Record<string, string> = {
      judiciary: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      legal_practitioner: 'bg-primary/20 text-primary border-primary/30',
      public_party: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };

    const roleLabels: Record<string, string> = {
      judiciary: 'Judiciary',
      legal_practitioner: 'Legal Practitioner',
      public_party: 'Public',
    };

    return (
      <span className={cn(
        "px-3 py-1 rounded-full text-xs font-medium border",
        roleStyles[profile.role_category] || roleStyles.public_party
      )}>
        {roleLabels[profile.role_category] || 'User'}
      </span>
    );
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">NyaySutra</h1>
            <p className="text-sm text-muted-foreground">Court Management System</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
              </div>
              {getRoleBadge()}
            </div>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Courts</h2>
              <p className="text-muted-foreground">
                View cases grouped by court
              </p>
            </div>
            
            <Button onClick={() => navigate('/dashboard')}>
              <FileText className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </div>

          {courts.length === 0 ? (
            <div className="text-center py-16">
              <Building2 className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No courts with cases yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Register a case to see courts here
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courts.map((court, index) => (
                <motion.div
                  key={court.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card-hover p-6 text-left group cursor-pointer"
                  onClick={() => navigate('/dashboard')}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {court.name}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {court.caseCount} {court.caseCount === 1 ? 'case' : 'cases'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                    <MapPin className="w-3 h-3" />
                    View all cases
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Courts;
