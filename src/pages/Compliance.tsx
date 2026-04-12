import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, CheckCircle2, FileText, AlertTriangle, BookOpen, Download, Building2, Scale, Lock, Server } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const GOVERNANCE_ITEMS = [
  { title: "Board Composition & Structure", description: "Guidelines for board composition, independent directors, committee formation, and meeting frequency as per Companies Act, 2013.", status: "template" },
  { title: "Code of Conduct", description: "Ethics and professional conduct standards for directors, employees, and key managerial personnel.", status: "template" },
  { title: "Related Party Transactions Policy", description: "Framework for identifying, approving, and disclosing transactions with related parties under Section 188.", status: "template" },
  { title: "Whistleblower / Vigil Mechanism", description: "Policy for reporting unethical behavior, fraud, or violations — mandatory under Section 177(9).", status: "template" },
  { title: "Nomination & Remuneration Policy", description: "Criteria for appointment and remuneration of directors and KMPs per Section 178.", status: "template" },
  { title: "Risk Management Framework", description: "Identification, assessment, and mitigation of business, operational, financial, and compliance risks.", status: "template" },
];

const COMPLIANCE_CHECKLIST = [
  { category: "Corporate", items: ["Annual Return (Form MGT-7)", "Financial Statements Filing", "Board Meeting Minutes", "Director KYC (DIR-3 KYC)", "Statutory Auditor Appointment", "CSR Reporting (if applicable)"] },
  { category: "Labour & Employment", items: ["PF & ESI Registration", "Minimum Wages Compliance", "POSH Committee Formation", "Shops & Establishments License", "Contract Labour Compliance", "Gratuity Payment"] },
  { category: "Tax & Finance", items: ["GST Return Filing", "TDS/TCS Compliance", "Income Tax Return", "Transfer Pricing Documentation", "Advance Tax Payment", "Tax Audit (Section 44AB)"] },
  { category: "Data Protection", items: ["Privacy Policy Publication", "Data Processing Records", "Consent Management", "Data Breach Response Plan", "Cross-border Data Transfer Assessment", "Data Retention Policy"] },
];

const RISK_CATEGORIES = [
  { risk: "Regulatory Non-compliance", likelihood: "Medium", impact: "High", mitigation: "Quarterly compliance audits, automated deadline tracking, legal team review." },
  { risk: "Data Breach / Cyber Attack", likelihood: "Medium", impact: "Critical", mitigation: "256-bit encryption, regular penetration testing, incident response plan, Indian data hosting." },
  { risk: "Conflict of Interest", likelihood: "Low", impact: "High", mitigation: "Automated conflict checker, mandatory declarations, Chinese wall policies." },
  { risk: "Client Data Mishandling", likelihood: "Low", impact: "Critical", mitigation: "Role-based access control, audit trails, data classification, encryption at rest." },
  { risk: "Professional Negligence", likelihood: "Low", impact: "High", mitigation: "Quality review workflows, deadline management, professional indemnity insurance." },
  { risk: "Financial Irregularities", likelihood: "Low", impact: "High", mitigation: "Segregation of duties, automated invoicing, financial audit trails, dual authorization." },
];

const CompliancePage = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-serif text-2xl font-bold mb-1 flex items-center gap-2">
          <Shield className="w-6 h-6 text-secondary" />
          Compliance & Governance
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Corporate governance templates, compliance checklists, and risk management frameworks
        </p>

        <Tabs defaultValue="governance">
          <TabsList className="bg-card/50 border border-border/20 mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="governance" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <Building2 className="w-4 h-4 mr-1.5" /> Governance
            </TabsTrigger>
            <TabsTrigger value="checklist" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <CheckCircle2 className="w-4 h-4 mr-1.5" /> Compliance Checklist
            </TabsTrigger>
            <TabsTrigger value="risk" className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <AlertTriangle className="w-4 h-4 mr-1.5" /> Risk Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="governance">
            <div className="grid gap-4">
              {GOVERNANCE_ITEMS.map((item) => (
                <div key={item.title} className="flex items-start gap-4 p-4 rounded-xl bg-card/50 border border-border/20 hover:border-secondary/30 transition-colors group">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-foreground mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0 border-border/30 hover:border-secondary/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <BookOpen className="w-3.5 h-3.5 mr-1" /> View Template
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="checklist">
            <div className="grid sm:grid-cols-2 gap-6">
              {COMPLIANCE_CHECKLIST.map((cat) => (
                <div key={cat.category} className="p-5 rounded-xl bg-card/50 border border-border/20">
                  <h3 className="font-serif font-semibold text-foreground mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-secondary rounded-full" />
                    {cat.category}
                  </h3>
                  <ul className="space-y-2.5">
                    {cat.items.map((item) => (
                      <li key={item} className="flex items-center gap-2.5">
                        <div className="w-4 h-4 rounded border border-border/40 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-muted-foreground/40" />
                        </div>
                        <span className="text-sm text-muted-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="risk">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Risk</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Likelihood</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Impact</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mitigation</th>
                  </tr>
                </thead>
                <tbody>
                  {RISK_CATEGORIES.map((r) => (
                    <tr key={r.risk} className="border-b border-border/10 hover:bg-muted/20">
                      <td className="py-3 px-4 font-medium text-foreground">{r.risk}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          r.likelihood === "Low" ? "bg-green-500/15 text-green-500" :
                          r.likelihood === "Medium" ? "bg-yellow-500/15 text-yellow-500" :
                          "bg-destructive/15 text-destructive"
                        }`}>{r.likelihood}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          r.impact === "High" ? "bg-orange-500/15 text-orange-500" :
                          r.impact === "Critical" ? "bg-destructive/15 text-destructive" :
                          "bg-yellow-500/15 text-yellow-500"
                        }`}>{r.impact}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs max-w-xs">{r.mitigation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-secondary/5 border border-secondary/15 flex items-start gap-3">
              <Shield className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm text-foreground mb-1">Security Measures</h4>
                <div className="flex flex-wrap gap-4 mt-2">
                  {[
                    { icon: Lock, label: "256-bit Encryption" },
                    { icon: Server, label: "India Data Hosting" },
                    { icon: Shield, label: "SOC 2 Compliant" },
                    { icon: Scale, label: "Immutable Audit Logs" },
                  ].map((b) => (
                    <div key={b.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <b.icon className="w-3.5 h-3.5 text-secondary" />
                      {b.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default CompliancePage;
