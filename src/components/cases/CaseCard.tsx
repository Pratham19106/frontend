// src/components/cases/CaseCard.tsx
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Scale, FileText, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CaseFile } from "@/types/case";
import { cn } from "@/lib/utils";

interface CaseCardProps {
  caseData: CaseFile;
}

const statusConfig = {
  open: {
    label: "Open",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  pending: {
    label: "Pending",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  closed: {
    label: "Closed",
    className: "bg-muted text-muted-foreground border-muted",
  },
};

export const CaseCard = ({ caseData }: CaseCardProps) => {
  const status = statusConfig[caseData.status as keyof typeof statusConfig] || statusConfig.open;
  
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="group h-full"
    >
      <Link
        to={`/cases/${caseData.id}`}
        className="block h-full glass-card p-5 hover:border-primary/30 transition-all"
      >
        {/* Header: Status Badge */}
        <div className="flex justify-between items-start mb-3">
          <Badge
            variant="outline"
            className={cn("text-xs font-medium", status.className)}
          >
            {status.label}
          </Badge>
          <span className="text-xs font-mono text-muted-foreground">
            {caseData.caseNumber}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold mb-3 line-clamp-2 min-h-[2.5rem]">
          {caseData.title}
        </h3>

        {/* Info Grid */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Scale className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{caseData.courtName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{caseData.presidingJudge}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/5 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {caseData.evidenceCount} evidence
          </span>
          <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <span>View</span>
            <ChevronRight className="h-3 w-3" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// import React from 'react';
// import { CaseFile } from '../types';
// import { FileText, Calendar, Users } from 'lucide-react'; // Assuming you use lucide-react icons

// interface CaseCardProps {
//   caseData: CaseFile;
// }

// export default function CaseCard({ caseData }: CaseCardProps) {
  
//   // Helper to get Judge Name safely
//   const judgeName = caseData.judge?.full_name || caseData.presidingJudge || 'Unassigned';
  
//   // Helper to get Lawyer B Name safely
//   const lawyerBName = caseData.lawyer_b?.full_name || 'Pending';

//   return (
//     <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 border border-gray-100 overflow-hidden">
//       <div className="p-5">
        
//         {/* Header */}
//         <div className="flex justify-between items-start mb-3">
//           <div>
//             <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
//               {caseData.courtName || 'Court Case'}
//             </span>
//             <h3 className="text-lg font-bold text-gray-900 mt-1">{caseData.title}</h3>
//           </div>
//           <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
//             caseData.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
//           }`}>
//             {caseData.status}
//           </span>
//         </div>

//         <p className="text-gray-600 text-sm mb-4 line-clamp-2">{caseData.description}</p>

//         {/* Assignments Grid */}
//         <div className="bg-gray-50 rounded p-3 grid grid-cols-2 gap-3 mb-4">
//           <div className="flex items-center space-x-2">
//             <Users className="w-4 h-4 text-gray-400" />
//             <div className="flex flex-col">
//               <span className="text-xs text-gray-500">Presiding Judge</span>
//               <span className="text-sm font-medium text-gray-900">{judgeName}</span>
//             </div>
//           </div>

//           <div className="flex items-center space-x-2">
//             <Users className="w-4 h-4 text-gray-400" />
//             <div className="flex flex-col">
//               <span className="text-xs text-gray-500">Opposing Counsel</span>
//               <span className="text-sm font-medium text-gray-900">{lawyerBName}</span>
//             </div>
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs text-gray-500">
//           <div className="flex items-center">
//             <Calendar className="w-3 h-3 mr-1" />
//             <span>{new Date(caseData.createdAt).toLocaleDateString()}</span>
//           </div>
//           <div className="flex items-center">
//             <FileText className="w-3 h-3 mr-1" />
//             <span>ID: {caseData.id.slice(0, 8)}...</span>
//           </div>
//         </div>

//       </div>
//     </div>
//   );
// }
