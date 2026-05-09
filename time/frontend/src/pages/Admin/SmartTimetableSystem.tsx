import React, { useState, useEffect, useCallback, useRef } from 'react';
import { smartTimetableApi, timetableApi } from '../../services/api';
import './SmartTimetableSystem.css';

interface UploadResult {
  uploadId: number;
  chronogram: any;
  meta: any;
}

interface ValidationResult {
  isValid: boolean;
  errors: any[];
  warnings: string[];
  matchedTeachers: any[];
  matchedSubjects: any[];
}

interface GenerationResult {
  generationId: number;
  entries: any[];
  conflicts: string[];
  warnings: string[];
  entryCount: number;
  className: string;
}

interface CurrentActivity {
  currentActivity: string;
  currentLesson: any;
  nextLesson: any;
  breakTime: any;
  lunchTime: any;
  endOfClasses: boolean;
  scheduleEmpty: boolean;
  remainingMinutes: number;
}

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DEF_SLOTS = [
  { label: 'Period 1', startTime: '08:10', endTime: '09:00', isBreak: false, isLunch: false },
  { label: 'Period 2', startTime: '09:00', endTime: '09:50', isBreak: false, isLunch: false },
  { label: 'Short Break', startTime: '09:50', endTime: '10:10', isBreak: true, isLunch: false },
  { label: 'Period 3', startTime: '10:10', endTime: '10:55', isBreak: false, isLunch: false },
  { label: 'Period 4', startTime: '10:55', endTime: '11:45', isBreak: false, isLunch: false },
  { label: 'Period 5', startTime: '11:45', endTime: '12:35', isBreak: false, isLunch: false },
  { label: 'Lunch Break', startTime: '12:35', endTime: '13:35', isBreak: false, isLunch: true },
  { label: 'Period 6', startTime: '13:35', endTime: '14:25', isBreak: false, isLunch: false },
  { label: 'Period 7', startTime: '14:25', endTime: '15:15', isBreak: false, isLunch: false },
];

const STS: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload'|'analyze'|'generate'|'preview'|'activity'>('upload');
  const [file, setFile] = useState<File|null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult|null>(null);
  const [validation, setValidation] = useState<ValidationResult|null>(null);
  const [validating, setValidating] = useState(false);
  const [generation, setGeneration] = useState<GenerationResult|null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [err, setErr] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<number|''>('');
  const [refData, setRefData] = useState<any>(null);
  const [currentActivity, setCurrentActivity] = useState<CurrentActivity|null>(null);
  const [realTime, setRealTime] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<'none'|'history'|'timetable'|'full'>('none');
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadRefData();
    loadHistory();
  }, []);

  useEffect(() => {
    if (selectedClass && activeTab === 'activity') {
      fetchActivity();
      const id = setInterval(fetchActivity, 30000);
      return () => clearInterval(id);
    }
  }, [selectedClass, activeTab]);

  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setRealTime(now.toLocaleTimeString('en-GB', { hour12: false }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const loadRefData = async () => {
    try {
      const r = await timetableApi.getReferenceData();
      const d = r.data?.data || r.data;
      setClasses(d?.classes || []);
      setRefData(d);
    } catch (e: any) {
      setErr('Failed to load reference data');
    }
  };

  const loadHistory = async () => {
    try {
      const r = await smartTimetableApi.getHistory();
      setHistory(r.data?.data || []);
    } catch { /* ignore */ }
  };

  const fetchActivity = async () => {
    if (!selectedClass) return;
    try {
      const r = await smartTimetableApi.getCurrentActivity(selectedClass as number);
      setCurrentActivity(r.data?.data || null);
    } catch { setCurrentActivity(null); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setErr(''); setUploadResult(null); setValidation(null); setGeneration(null); }
  };

  const doUpload = async () => {
    if (!file) { setErr('Select a file first'); return; }
    setUploading(true); setErr(''); setUploadProgress(0);
    try {
      const r = await smartTimetableApi.uploadChronogram(file, (p) => setUploadProgress(p));
      setUploadResult(r.data);
      setActiveTab('analyze');
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Upload failed');
    } finally { setUploading(false); }
  };

  const doValidate = async () => {
    if (!uploadResult?.uploadId) { setErr('Upload a chronogram first'); return; }
    setValidating(true); setErr('');
    try {
      const r = await smartTimetableApi.validateChronogram(uploadResult.uploadId);
      setValidation(r.data?.data || null);
      setActiveTab('generate');
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Validation failed');
    } finally { setValidating(false); }
  };

  const doGenerate = async () => {
    if (!uploadResult?.uploadId || !selectedClass) { setErr('Select a class and upload a chronogram'); return; }
    setGenerating(true); setErr(''); setGeneration(null);
    try {
      const r = await smartTimetableApi.generateTimetable(uploadResult.uploadId, selectedClass as number);
      setGeneration(r.data?.data || null);
      setActiveTab('preview');
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Generation failed');
    } finally { setGenerating(false); }
  };

  const doSave = async () => {
    if (!generation?.generationId) return;
    setSaving(true); setSaveMsg('');
    try {
      await smartTimetableApi.saveTimetable(generation.generationId);
      setSaveMsg('Timetable saved successfully!');
      loadHistory();
    } catch (e: any) {
      setSaveMsg(e.response?.data?.error || 'Save failed');
    } finally { setSaving(false); }
  };

  const doExport = async (format: 'excel'|'csv'|'pdf') => {
    if (!generation?.generationId && !selectedClass) { setErr('Nothing to export'); return; }
    try {
      const res = await smartTimetableApi.exportTimetable({ generationId: generation?.generationId, classId: selectedClass ? +selectedClass : undefined, format });
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timetable.${format === 'excel' ? 'xlsx' : format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErr('Export failed');
    }
  };

  const doDeleteAllHistory = async () => {
    setDeleting(true); setErr('');
    try {
      await smartTimetableApi.deleteAllHistory(selectedClass ? +selectedClass : undefined);
      setHistory([]);
      setSaveMsg('All history deleted successfully');
      setShowDeleteConfirm('none');
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Failed to delete history');
    } finally { setDeleting(false); }
  };

  const doDeleteAllTimetable = async () => {
    setDeleting(true); setErr('');
    try {
      await smartTimetableApi.deleteAllTimetable(selectedClass ? +selectedClass : undefined);
      setSaveMsg('All timetable entries deleted successfully');
      setShowDeleteConfirm('none');
      loadHistory();
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Failed to delete timetable');
    } finally { setDeleting(false); }
  };

  const doFullReset = async () => {
    setDeleting(true); setErr('');
    try {
      await smartTimetableApi.fullReset(selectedClass ? +selectedClass : undefined);
      setHistory([]);
      setGeneration(null);
      setUploadResult(null);
      setValidation(null);
      setSaveMsg('Full timetable reset completed successfully');
      setShowDeleteConfirm('none');
    } catch (e: any) {
      setErr(e.response?.data?.error || 'Failed to reset timetable');
    } finally { setDeleting(false); }
  };

  const buildGrid = useCallback(() => {
    if (!generation?.entries?.length) return { slots: DEF_SLOTS, grid: [] as any[][] };
    const slots = [...DEF_SLOTS];
    const grid: any[][] = [];
    for (let d = 1; d <= 5; d++) {
      const row: any[] = [];
      for (let s = 0; s < slots.length; s++) {
        const entry = generation.entries.find((e: any) => e.day_of_week === d && e.start_time === slots[s].startTime && e.end_time === slots[s].endTime);
        row.push(entry || null);
      }
      grid.push(row);
    }
    return { slots, grid };
  }, [generation]);

  const { slots, grid } = buildGrid();

  const getSubjectName = (subjectId: number) => refData?.subjects?.find((s: any) => s.id === subjectId)?.name || 'Unknown';
  const getTeacherName = (teacherId: number) => refData?.teachers?.find((t: any) => t.id === teacherId)?.name || 'Unassigned';
  const getClassroomName = (classroomId: number) => refData?.classrooms?.find((c: any) => c.id === classroomId)?.name || '';

  return (
    <div className="sts-container">
      <header className="sts-header">
        <h1>Smart School Timetable System</h1>
        <div className="sts-clock">{realTime}</div>
      </header>

      {err && <div className="sts-alert sts-alert-err" onClick={() => setErr('')}>{err} <span className="sts-close">×</span></div>}
      {saveMsg && <div className={`sts-alert ${saveMsg.includes('success') ? 'sts-alert-ok' : 'sts-alert-err'}`} onClick={() => setSaveMsg('')}>{saveMsg} <span className="sts-close">×</span></div>}

      <nav className="sts-tabs">
        <button className={activeTab==='upload'?'active':''} onClick={()=>setActiveTab('upload')}>1. Upload</button>
        <button className={activeTab==='analyze'?'active':''} onClick={()=>setActiveTab('analyze')} disabled={!uploadResult}>2. AI Analysis</button>
        <button className={activeTab==='generate'?'active':''} onClick={()=>setActiveTab('generate')} disabled={!validation}>3. Generate</button>
        <button className={activeTab==='preview'?'active':''} onClick={()=>setActiveTab('preview')} disabled={!generation}>4. Preview</button>
        <button className={activeTab==='activity'?'active':''} onClick={()=>setActiveTab('activity')}>Live Activity</button>
      </nav>

      <div className="sts-main">
        {activeTab==='upload' && (
          <section className="sts-panel">
            <h2>Upload Chronogram</h2>
            <p className="sts-hint">Upload any file format: PDF, Word (.docx), Excel (.xlsx), CSV, Image, Text, JSON</p>
            <div className="sts-upload-zone" onClick={()=>fileRef.current?.click()} onDrop={(e)=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f){setFile(f);setErr('');}}} onDragOver={(e)=>e.preventDefault()}>
              <input type="file" ref={fileRef} style={{display:'none'}} accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,.txt,.json,.png,.jpg,.jpeg,.bmp,.webp,.tiff" onChange={handleFile} />
              <div className="sts-upload-icon">Upload</div>
              <p>{file ? file.name : 'Drag & drop or click to browse'}</p>
              {file && <span className="sts-meta">{Math.round(file.size/1024)} KB • {file.type || 'unknown'}</span>}
            </div>
            {uploading && (
              <div className="sts-progress">
                <div className="sts-progress-bar" style={{width:`${uploadProgress}%`}}></div>
                <span>Analyzing with AI... {uploadProgress}%</span>
              </div>
            )}
            <div className="sts-actions">
              <button className="sts-btn-primary" onClick={doUpload} disabled={!file||uploading}>{uploading?'Analyzing...':'AI Analyze File'}</button>
            </div>
            {uploadResult && (
              <div className="sts-result-box">
                <h4>Extracted Data</h4>
                <p><strong>Subjects found:</strong> {uploadResult.chronogram?.subjects?.length || 0}</p>
                <p><strong>Time slots found:</strong> {uploadResult.chronogram?.timeSlots?.length || 0}</p>
                <p><strong>Class detected:</strong> {uploadResult.chronogram?.className || 'None'}</p>
              </div>
            )}
          </section>
        )}

        {activeTab==='analyze' && (
          <section className="sts-panel">
            <h2>AI Analysis & Validation</h2>
            <div className="sts-actions">
              <button className="sts-btn-primary" onClick={doValidate} disabled={validating}>{validating?'Validating...':'✅ Validate Against Database'}</button>
            </div>
            {validation && (
              <div className="sts-validation">
                <div className={`sts-val-status ${validation.isValid?'ok':'warn'}`}>
                  {validation.isValid ? 'All data validated successfully' : `${validation.errors.length} issues found`}
                </div>
                {validation.warnings.length > 0 && (
                  <div className="sts-val-section">
                    <h4>Warnings ({validation.warnings.length})</h4>
                    <ul>{validation.warnings.map((w,i)=><li key={i}>{w}</li>)}</ul>
                  </div>
                )}
                {validation.errors.length > 0 && (
                  <div className="sts-val-section sts-val-err">
                    <h4>Errors ({validation.errors.length})</h4>
                    <ul>{validation.errors.map((e,i)=><li key={i}><strong>{e.type}:</strong> {e.message}</li>)}</ul>
                  </div>
                )}
                {validation.matchedTeachers.length > 0 && (
                  <div className="sts-val-section">
                    <h4>Matched Teachers ({validation.matchedTeachers.length})</h4>
                    <ul>{validation.matchedTeachers.map((m,i)=><li key={i}>{m.dbTeacher?.name} → {m.chronogramSubject?.name}</li>)}</ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activeTab==='generate' && (
          <section className="sts-panel">
            <h2>Smart Generation Settings</h2>
            <div className="sts-form-row">
              <label>Target Class</label>
              <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value?+e.target.value:'')}>
                <option value="">Select class...</option>
                {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="sts-form-row">
              <label>Chronogram</label>
              <div className="sts-readonly">{uploadResult?.meta?.originalName || 'Uploaded file'}</div>
            </div>
            <div className="sts-actions">
              <button className="sts-btn-primary" onClick={doGenerate} disabled={generating||!selectedClass}>{generating?'Generating...':'⚡ Generate Smart Timetable'}</button>
            </div>
            {generation && (
              <div className="sts-gen-summary">
                <p><strong>Entries:</strong> {generation.entryCount}</p>
                <p><strong>Conflicts:</strong> {generation.conflicts.length}</p>
                <p><strong>Warnings:</strong> {generation.warnings.length}</p>
              </div>
            )}
          </section>
        )}

        {activeTab==='preview' && generation && (
          <section className="sts-panel">
            <h2>Timetable Preview</h2>
            <div className="sts-actions">
              <button className="sts-btn-success" onClick={doSave} disabled={saving}>{saving?'Saving...':'Save to Database'}</button>
              <button className="sts-btn" onClick={()=>doExport('excel')}>Excel</button>
              <button className="sts-btn" onClick={()=>doExport('csv')}>CSV</button>
              <button className="sts-btn" onClick={()=>doExport('pdf')}>PDF</button>
            </div>
            {generation.conflicts.length > 0 && (
              <div className="sts-conflicts">
                <h4>Conflicts ({generation.conflicts.length})</h4>
                <ul>{generation.conflicts.map((c,i)=><li key={i}>{c}</li>)}</ul>
              </div>
            )}
            <div className="sts-timetable-wrapper">
              <table className="sts-timetable">
                <thead>
                  <tr><th>Time</th>{DAYS.slice(1,6).map(d=><th key={d}>{d}</th>)}</tr>
                </thead>
                <tbody>
                  {slots.map((slot,si)=>{
                    if (slot.isBreak) return (
                      <tr key={si} className="sts-break-row">
                        <td className="sts-time-cell">{slot.startTime}<br/>{slot.endTime}<br/><small>{slot.label}</small></td>
                        {Array.from({length:5}).map((_,di)=><td key={di} className="sts-break-cell">{slot.label}</td>)}
                      </tr>
                    );
                    if (slot.isLunch) return (
                      <tr key={si} className="sts-lunch-row">
                        <td className="sts-time-cell">{slot.startTime}<br/>{slot.endTime}<br/><small>{slot.label}</small></td>
                        {Array.from({length:5}).map((_,di)=><td key={di} className="sts-lunch-cell">{slot.label}</td>)}
                      </tr>
                    );
                    return (
                      <tr key={si}>
                        <td className="sts-time-cell">{slot.startTime}<br/>{slot.endTime}<br/><small>{slot.label}</small></td>
                        {grid.map((row,di)=>{
                          const cell = row[si];
                          return (
                            <td key={di} className={`sts-lesson-cell ${cell?'sts-filled':''}`}>
                              {cell && (
                                <div>
                                  <div className="sts-subj">{getSubjectName(cell.subject_id)}</div>
                                  <div className="sts-teach">{getTeacherName(cell.teacher_id)}</div>
                                  <div className="sts-room">{getClassroomName(cell.classroom_id)}</div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab==='activity' && (
          <section className="sts-panel">
            <h2>Live Activity Monitor</h2>
            <div className="sts-form-row">
              <label>Class</label>
              <select value={selectedClass} onChange={e=>{setSelectedClass(e.target.value?+e.target.value:'');}}>
                <option value="">Select class...</option>
                {classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {currentActivity && !currentActivity.scheduleEmpty && (
              <div className="sts-activity-cards">
                <div className={`sts-activity-card ${currentActivity.currentActivity==='lesson'?'active':''}`}>
                  <h3>Current Lesson</h3>
                  {currentActivity.currentLesson ? (
                    <>
                      <div className="sts-big">{currentActivity.currentLesson.subject_name}</div>
                      <div>Teacher: {currentActivity.currentLesson.teacher_name}</div>
                      <div>Room: {currentActivity.currentLesson.classroom_name}</div>
                      <div className="sts-time">{currentActivity.currentLesson.start_time} - {currentActivity.currentLesson.end_time}</div>
                      <div className="sts-remaining">{currentActivity.remainingMinutes} min remaining</div>
                    </>
                  ) : <div className="sts-none">No active lesson</div>}
                </div>
                <div className={`sts-activity-card ${currentActivity.currentActivity==='break'?'active':''}`}>
                  <h3>Break / Lunch</h3>
                  {currentActivity.breakTime ? (
                    <>
                      <div className="sts-big">Break Time</div>
                      <div>{currentActivity.breakTime.start} - {currentActivity.breakTime.end}</div>
                      <div>{Math.round(currentActivity.breakTime.durationMinutes)} min</div>
                    </>
                  ) : currentActivity.lunchTime ? (
                    <>
                      <div className="sts-big">Lunch Break</div>
                      <div>{currentActivity.lunchTime.start} - {currentActivity.lunchTime.end}</div>
                      <div>{Math.round(currentActivity.lunchTime.durationMinutes)} min</div>
                    </>
                  ) : <div className="sts-none">Not in break</div>}
                </div>
                <div className={`sts-activity-card ${currentActivity.nextLesson?'active':''}`}>
                  <h3>Next Lesson</h3>
                  {currentActivity.nextLesson ? (
                    <>
                      <div className="sts-big">{currentActivity.nextLesson.subject_name}</div>
                      <div>Teacher: {currentActivity.nextLesson.teacher_name}</div>
                      <div className="sts-time">{currentActivity.nextLesson.start_time} - {currentActivity.nextLesson.end_time}</div>
                      {currentActivity.remainingMinutes > 0 && currentActivity.currentActivity !== 'lesson' && (
                        <div className="sts-remaining">Starts in {currentActivity.remainingMinutes} min</div>
                      )}
                    </>
                  ) : <div className="sts-none">No more lessons today</div>}
                </div>
                <div className={`sts-activity-card ${currentActivity.endOfClasses?'active':''}`}>
                  <h3>End of Day</h3>
                  {currentActivity.endOfClasses ? (
                    <><div className="sts-big">Classes Over</div><div>Have a great day!</div></>
                  ) : <div className="sts-none">School day in progress</div>}
                </div>
              </div>
            )}
            {currentActivity?.scheduleEmpty && <div className="sts-empty">No schedule found for this class today.</div>}
          </section>
        )}
      </div>

      {history.length > 0 && (
        <section className="sts-history">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0 }}>Generation History</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="sts-btn" style={{ fontSize: '0.85rem' }} onClick={() => setShowDeleteConfirm('history')}>🗑 Delete History</button>
              <button className="sts-btn" style={{ fontSize: '0.85rem' }} onClick={() => setShowDeleteConfirm('timetable')}>🗑 Delete Timetable</button>
              <button className="sts-btn" style={{ fontSize: '0.85rem', background: '#dc3545', color: 'white' }} onClick={() => setShowDeleteConfirm('full')}>⚠ Full Reset</button>
            </div>
          </div>
          <table className="sts-history-table">
            <thead><tr><th>Date</th><th>Class</th><th>Chronogram</th><th>Entries</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {history.slice(0,10).map((h,i)=>{
                const gen = h.generated_timetable ? JSON.parse(h.generated_timetable) : [];
                return (
                  <tr key={i}>
                    <td>{new Date(h.created_at).toLocaleString()}</td>
                    <td>{h.class_name}</td>
                    <td>{h.chronogram_name || 'Manual'}</td>
                    <td>{Array.isArray(gen)?gen.length:0}</td>
                    <td><span className={`sts-tag ${h.validation_status==='valid'?'sts-tag-ok':'sts-tag-warn'}`}>{h.validation_status}</span></td>
                    <td><button className="sts-btn" style={{ fontSize: '0.8rem', padding: '2px 8px' }} onClick={async () => { await smartTimetableApi.deleteHistory(h.id); loadHistory(); }}>✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {showDeleteConfirm !== 'none' && (
        <div className="sts-delete-confirm-overlay">
          <div className="sts-delete-confirm">
            <h3>⚠ Confirm Delete</h3>
            {showDeleteConfirm === 'history' && (
              <p>Are you sure you want to delete <strong>all generation history</strong>?{selectedClass ? ` (for selected class)` : ''} This cannot be undone.</p>
            )}
            {showDeleteConfirm === 'timetable' && (
              <p>Are you sure you want to delete <strong>all timetable entries</strong>?{selectedClass ? ` (for selected class)` : ''} This cannot be undone.</p>
            )}
            {showDeleteConfirm === 'full' && (
              <p>Are you sure you want to <strong>fully reset</strong> the timetable system?{selectedClass ? ` (for selected class)` : ''} This will delete ALL history, timetable entries, and uploads. This cannot be undone.</p>
            )}
            <div className="sts-delete-confirm-actions">
              <button className="sts-btn" onClick={() => setShowDeleteConfirm('none')}>Cancel</button>
              {showDeleteConfirm === 'history' && (
                <button className="sts-btn" style={{ background: '#dc3545', color: 'white' }} onClick={doDeleteAllHistory} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete All History'}
                </button>
              )}
              {showDeleteConfirm === 'timetable' && (
                <button className="sts-btn" style={{ background: '#dc3545', color: 'white' }} onClick={doDeleteAllTimetable} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete All Timetable'}
                </button>
              )}
              {showDeleteConfirm === 'full' && (
                <button className="sts-btn" style={{ background: '#dc3545', color: 'white' }} onClick={doFullReset} disabled={deleting}>
                  {deleting ? 'Resetting...' : 'Full Reset'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default STS;
