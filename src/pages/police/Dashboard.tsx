import { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getFIRCounts, listFIRs } from "@/services/policeService";
import { FIR } from "@/types/case";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const PoliceDashboard = () => {
  const [counts, setCounts] = useState({ total: 0, pending: 0 });
  const [firs, setFirs] = useState<FIR[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const c = await getFIRCounts();
        const list = await listFIRs(50);
        if (!mounted) return;
        setCounts(c);
        if (!Array.isArray(list)) {
          console.warn("policeService.listFIRs returned non-array:", list);
          setFirs([]);
        } else {
          setFirs(list);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Police Dashboard</h2>
        <div className="flex gap-2">
          <Link
            to="/police/new-fir"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <Plus size={16} /> New FIR
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white/5 rounded">
          <div className="text-sm text-muted-foreground">Total FIRs</div>
          <div className="text-2xl font-bold">{counts.total}</div>
        </div>
        <div className="p-4 bg-white/5 rounded">
          <div className="text-sm text-muted-foreground">Pending Cases</div>
          <div className="text-2xl font-bold">{counts.pending}</div>
        </div>
      </div>

      <div className="bg-white/5 rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Recent FIRs</h3>
          <div className="flex items-center gap-2">
            <Search />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-muted-foreground">
                <th className="py-2">FIR Number</th>
                <th className="py-2">Date</th>
                <th className="py-2">Offense</th>
                <th className="py-2">Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {firs.length === 0
                ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      No FIRs found
                    </td>
                  </tr>
                )
                : (
                  firs.map((f) => {
                    const dateStr = f?.incident_date
                      ? new Date(f.incident_date).toLocaleString()
                      : "-";
                    return (
                      <tr key={f.id} className="border-t border-white/5">
                        <td className="py-2">{f?.fir_number ?? "-"}</td>
                        <td className="py-2">{dateStr}</td>
                        <td className="py-2">{f?.offense_nature ?? "-"}</td>
                        <td className="py-2">{f?.status ?? "-"}</td>
                        <td className="py-2">
                          <button
                            onClick={() => navigate(`/police/firs/${f.id}`)}
                            className="text-sm text-primary underline"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PoliceDashboard;
