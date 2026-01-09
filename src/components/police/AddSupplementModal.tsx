import { useState } from "react";
import { InvestigationFile } from "@/types/case";
import { uploadInvestigationFile } from "@/services/policeService";
import { toast } from "sonner";

interface Props {
  firId: string;
  onClose: () => void;
  onAdded: (file: InvestigationFile) => void;
}

const AddSupplementModal = ({ firId, onClose, onAdded }: Props) => {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("Supplementary Chargesheet");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!file) return toast.error("Select a file");
    setLoading(true);
    try {
      const added = await uploadInvestigationFile(firId, file, type, notes);
      onAdded(added);
      toast.success("Uploaded");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white/5 p-6 rounded w-full max-w-lg">
        <h3 className="text-lg font-medium mb-3">
          Add Supplementary Chargesheet / Evidence
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm">File Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input"
            >
              <option>Supplementary Chargesheet</option>
              <option>Forensic Report</option>
              <option>Witness Statement</option>
            </select>
          </div>
          <div>
            <label className="block text-sm">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input h-24"
            />
          </div>
          <div>
            <label className="block text-sm">File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSupplementModal;
