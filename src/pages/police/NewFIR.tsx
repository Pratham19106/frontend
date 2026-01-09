import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createFIR } from "@/services/policeService";
import { toast } from "sonner";

const NewFIR = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({
    fir_number: "",
    police_station: "",
    informant_name: "",
    informant_contact: "",
    incident_date: "",
    incident_place: "",
    offense_nature: "",
    bns_section: "",
    accused_name: "",
    victim_name: "",
    description: "",
  });
  const navigate = useNavigate();

  const handleChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      const created = await createFIR(payload);
      toast.success("FIR created");
      navigate(`/police/firs/${created.id}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create FIR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold">Register New FIR</h2>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label className="block text-sm">FIR Number</label>
          <input
            name="fir_number"
            value={form.fir_number}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <div>
          <label className="block text-sm">Police Station</label>
          <input
            name="police_station"
            value={form.police_station}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <div className="md:col-span-2">
          <h3 className="font-medium">Complainant Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <input
              name="informant_name"
              value={form.informant_name}
              onChange={handleChange}
              placeholder="Name"
              className="input"
              required
            />
            <input
              name="informant_contact"
              value={form.informant_contact}
              onChange={handleChange}
              placeholder="Contact"
              className="input"
              required
            />
            <input name="" placeholder="Address (optional)" className="input" />
          </div>
        </div>

        <div>
          <label className="block text-sm">Incident Date/Time</label>
          <input
            name="incident_date"
            value={form.incident_date}
            onChange={handleChange}
            type="datetime-local"
            className="input"
            required
          />
        </div>
        <div>
          <label className="block text-sm">Incident Place</label>
          <input
            name="incident_place"
            value={form.incident_place}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm">Offense Type</label>
          <input
            name="offense_nature"
            value={form.offense_nature}
            onChange={handleChange}
            className="input"
            required
          />
        </div>
        <div>
          <label className="block text-sm">BNS Section</label>
          <input
            name="bns_section"
            value={form.bns_section}
            onChange={handleChange}
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm">Accused Name (if known)</label>
          <input
            name="accused_name"
            value={form.accused_name}
            onChange={handleChange}
            className="input"
          />
        </div>
        <div>
          <label className="block text-sm">Victim Name</label>
          <input
            name="victim_name"
            value={form.victim_name}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm">
            Description / Evidence Summary
          </label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="input h-28"
          />
        </div>

        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Submit"}
          </button>
          <button type="button" className="btn" onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewFIR;
