import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import TrustDashboard from '../components/TrustDashboard';
import { Upload, Search, FileText, BarChart2, BookOpen, MessageSquare } from 'lucide-react';
import axios from 'axios';

const ResearchWorkspace = () => {
  const [file, setFile] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [documentData, setDocumentData] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'summary', 'sections', 'gaps', 'methodology'
  const [query, setQuery] = useState('');
  const [answering, setAnswering] = useState(false);
  const [intelligence, setIntelligence] = useState(null);
  const [analysisData, setAnalysisData] = useState({});
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const pollStatus = async (jobId) => {
    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(`/api/pdf/status/${jobId}`);
        setProgress(data.progress || 0);
        if (data.status === 'completed') {
          setJobStatus('completed');
          // Fetch initial summary
          const summaryRes = await axios.post('/api/pdf/summary', { documentId: data.result.documentId });
          setDocumentData({ ...data.result, ...summaryRes.data });
          clearInterval(interval);
        } else if (data.status === 'failed') {
          setJobStatus('failed');
          clearInterval(interval);
        }
      } catch (e) {
        clearInterval(interval);
      }
    }, 2000);
  };

  const runAnalysis = async (type) => {
    if (!documentData || analysisData[type]) {
      setActiveTab(type);
      return;
    }
    setLoadingAnalysis(true);
    setActiveTab(type);
    try {
      const { data } = await axios.post(`/api/pdf/${type}`, { documentId: documentData.documentId });
      setAnalysisData(prev => ({ ...prev, [type]: data }));
    } catch (err) {
      alert(`Analysis failed: ${err.message}`);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  const handleUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;
    setFile(uploadedFile);
    setJobStatus('uploading');

    const formData = new FormData();
    formData.append('pdf', uploadedFile);

    try {
      const { data } = await axios.post('/api/pdf/ingest', formData);
      setJobStatus('indexing');
      pollStatus(data.jobId);
    } catch (err) {
      alert("Upload failed: " + err.message);
      setJobStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-verixa-bg text-verixa-text flex flex-col font-sans">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-12 gap-8">
        {/* Sidebar / Research Tools */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="bg-verixa-surface border border-white/5 rounded-2xl p-6 shadow-2xl shadow-black/50">
            <h2 className="text-xl font-serif mb-6 flex items-center gap-3 text-verixa-accent">
              <BookOpen className="w-5 h-5" />
              Research Workstation
            </h2>
            
            {jobStatus === 'idle' || !jobStatus ? (
              <label className="border-2 border-dashed border-white/10 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-verixa-accent/50 hover:bg-white/5 transition-all duration-500 group">
                <Upload className="w-10 h-10 text-verixa-text3 mb-4 group-hover:-translate-y-1 transition-transform" />
                <span className="text-sm text-verixa-text3 font-medium">Load Research Paper</span>
                <input type="file" className="hidden" onChange={handleUpload} accept=".pdf" />
              </label>
            ) : jobStatus === 'uploading' || jobStatus === 'indexing' ? (
              <div className="p-8 text-center space-y-4">
                <div className="relative w-20 h-20 mx-auto">
                   <div className="absolute inset-0 border-4 border-verixa-accent/20 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-verixa-accent rounded-full border-t-transparent animate-spin"></div>
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest">{jobStatus === 'uploading' ? 'Uploading...' : 'Deep Indexing...'}</p>
                  <p className="text-[10px] text-verixa-text3 mt-1">Status: {progress}% Complete</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeUp">
                <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="bg-verixa-accent/10 p-2 rounded-lg">
                    <FileText className="w-6 h-6 text-verixa-accent" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold truncate">{file?.name}</p>
                    <p className="text-[10px] text-verixa-text3 uppercase tracking-wider">Indexed Research Artifact</p>
                  </div>
                </div>
                
                {/* Advanced Tools Navigation */}
                <div className="space-y-2 pt-2">
                  <p className="text-[10px] text-verixa-accent uppercase font-black tracking-[0.2em] mb-4 pl-1">Analysis Modules</p>
                  
                  {[
                    { id: 'chat', label: 'Intelligence Chat', icon: MessageSquare },
                    { id: 'summary', label: 'Executive Summary', icon: FileText },
                    { id: 'sections', label: 'Section Synthesis', icon: BarChart2 },
                    { id: 'gaps', label: 'Research Gap Analysis', icon: Search },
                    { id: 'methodology', label: 'Methodology Explainer', icon: BookOpen },
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => tab.id === 'chat' ? setActiveTab('chat') : runAnalysis(tab.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${activeTab === tab.id ? 'bg-verixa-accent text-black border-verixa-accent shadow-lg shadow-verixa-accent/20 font-bold' : 'bg-white/5 text-verixa-text2 border-white/5 hover:bg-white/10'}`}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span className="text-xs uppercase tracking-widest">{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {intelligence && activeTab === 'chat' && (
            <TrustDashboard 
              confidenceScore={intelligence.data.confidence_score} 
              sourceCount={intelligence.data.grounding_sources?.length || 0}
              status="verified"
            />
          )}
        </div>

        {/* Main Intelligence Terminal */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="bg-verixa-surface border border-white/5 rounded-2xl p-8 flex-1 flex flex-col min-h-[700px] shadow-2xl relative overflow-hidden">
             
             {/* Header */}
             <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
               <h2 className="text-xl font-serif flex items-center gap-3">
                {activeTab === 'chat' && <MessageSquare className="w-5 h-5 text-verixa-accent" />}
                {activeTab === 'summary' && <FileText className="w-5 h-5 text-verixa-accent" />}
                {activeTab === 'sections' && <BarChart2 className="w-5 h-5 text-verixa-accent" />}
                {activeTab === 'gaps' && <Search className="w-5 h-5 text-verixa-accent" />}
                {activeTab === 'methodology' && <BookOpen className="w-5 h-5 text-verixa-accent" />}
                <span className="uppercase tracking-widest text-sm font-black">
                  {activeTab.replace('_', ' ')} Terminal
                </span>
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] text-verixa-text3 uppercase tracking-widest">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  Grounded Evidence
                </div>
              </div>
             </div>

             {/* Content Area */}
             <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {loadingAnalysis ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <div className="w-12 h-12 border-4 border-verixa-accent/20 border-t-verixa-accent rounded-full animate-spin"></div>
                    <p className="text-xs text-verixa-accent uppercase font-black tracking-widest">Synthesizing Paper Intelligence...</p>
                  </div>
                ) : activeTab === 'chat' ? (
                  /* Chat View (Existing Logic) */
                  <div className="space-y-10">
                    {!intelligence ? (
                       <div className="h-full flex flex-col items-center justify-center text-verixa-text3 opacity-30 pt-32">
                        <MessageSquare className="w-16 h-16 mb-4 stroke-1" />
                        <p className="text-sm font-serif italic tracking-wide">Enter a research query to begin grounded synthesis.</p>
                      </div>
                    ) : (
                      <div className="space-y-10 animate-fadeUp">
                        <div className="relative">
                          <div className="absolute -left-4 top-0 bottom-0 w-[1px] bg-verixa-accent/30"></div>
                          <p className="text-[15px] text-verixa-text leading-relaxed whitespace-pre-wrap font-medium pl-4">{intelligence.data.answer}</p>
                        </div>
                        <SourceTrace sources={intelligence.data.original_sources} />
                      </div>
                    )}
                  </div>
                ) : activeTab === 'summary' ? (
                  <div className="space-y-8 animate-fadeUp">
                    <AnalysisSection title="Primary Objective" content={analysisData.summary?.objective} />
                    <AnalysisSection title="Core Novelty & Contribution" content={analysisData.summary?.novelty} />
                    <AnalysisSection title="Key Research Findings" content={analysisData.summary?.findings} />
                    <AnalysisSection title="Academic Impact" content={analysisData.summary?.impact} />
                  </div>
                ) : activeTab === 'sections' ? (
                  <div className="space-y-6 animate-fadeUp">
                    {analysisData.sections && Object.entries(analysisData.sections).map(([name, data]) => (
                      <div key={name} className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xs uppercase font-black tracking-widest text-verixa-accent">{name}</h3>
                          <span className="text-[10px] text-verixa-text3 bg-white/5 px-2 py-0.5 rounded">Refs: {data.page_references?.join(', ')}</span>
                        </div>
                        <p className="text-sm text-verixa-text2 leading-relaxed italic">"{data.summary}"</p>
                      </div>
                    ))}
                  </div>
                ) : activeTab === 'gaps' ? (
                  <div className="space-y-8 animate-fadeUp">
                    <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl mb-8">
                       <p className="text-[10px] text-red-400 uppercase font-black tracking-widest mb-3">Critical Critique</p>
                       <p className="text-sm text-verixa-text2 leading-relaxed italic">"{analysisData.gaps?.critique}"</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {analysisData.gaps?.gaps?.map((gap, i) => (
                        <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-xl hover:border-verixa-accent/30 transition-all">
                          <h4 className="text-[10px] uppercase font-black text-verixa-accent mb-2">{gap.type}</h4>
                          <p className="text-sm font-bold mb-2">{gap.point}</p>
                          <p className="text-xs text-verixa-text3 leading-relaxed">{gap.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : activeTab === 'methodology' ? (
                  <div className="space-y-8 animate-fadeUp">
                    <AnalysisSection title="Technical Architecture" content={analysisData.methodology?.architecture_summary} />
                    <AnalysisSection title="Methodological Logic" content={analysisData.methodology?.explanation} />
                    <div>
                      <p className="text-[10px] text-verixa-accent uppercase font-black tracking-widest mb-4">Core Terminology</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analysisData.methodology?.core_terminology?.map((t, i) => (
                          <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-xl">
                            <p className="text-xs font-bold text-verixa-accent mb-1">{t.term}</p>
                            <p className="text-[11px] text-verixa-text3">{t.def}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
             </div>

             {/* Footer Input for Chat */}
             {activeTab === 'chat' && (
               <div className="relative pt-6 mt-8 border-t border-white/5">
                <input 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
                  placeholder="Interrogate research artifact..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 pr-16 focus:outline-none focus:border-verixa-accent/50 focus:bg-white/10 transition-all text-sm font-medium tracking-tight shadow-inner"
                />
                <button 
                  onClick={handleQuery}
                  disabled={answering || !documentData}
                  className="absolute right-4 top-[2.75rem] -translate-y-1/2 p-3 bg-verixa-accent text-black rounded-xl disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed hover:bg-white transition-all active:scale-95 shadow-xl shadow-verixa-accent/20"
                >
                  {answering ? <div className="w-5 h-5 border-2 border-black border-t-transparent animate-spin rounded-full"></div> : <Search className="w-5 h-5" />}
                </button>
              </div>
             )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

/* Helper Components */
const AnalysisSection = ({ title, content }) => (
  <div className="space-y-3">
    <p className="text-[10px] text-verixa-accent uppercase font-black tracking-widest">{title}</p>
    <div className="p-6 bg-white/[0.03] border border-white/5 rounded-2xl">
      <p className="text-sm text-verixa-text2 leading-relaxed whitespace-pre-wrap">{content || 'Analysis pending...'}</p>
    </div>
  </div>
);

const SourceTrace = ({ sources }) => (
  <div className="pt-8 border-t border-white/5">
    <div className="flex items-center gap-2 mb-6">
       <ShieldAlert className="w-4 h-4 text-verixa-accent" />
       <p className="text-[10px] text-verixa-accent uppercase font-black tracking-[0.2em]">Academic Source Grounding</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sources?.map((src, i) => (
        <div key={i} className="p-4 bg-white/[0.02] rounded-xl border border-white/10 group hover:border-verixa-accent/50 transition-all duration-300">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-verixa-accent/80">EVIDENCE_0{i+1}</span>
            <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded text-verixa-text3">PAGE_{src.metadata.page}</span>
          </div>
          <p className="text-[12px] text-verixa-text2 leading-relaxed group-hover:text-verixa-text transition-colors italic">"{src.text.slice(0, 240)}..."</p>
        </div>
      ))}
    </div>
  </div>
);



export default ResearchWorkspace;
