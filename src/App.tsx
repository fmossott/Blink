import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputNumber } from 'primereact/inputnumber';
import { Knob } from 'primereact/knob';
import { Tag } from 'primereact/tag';
import { Eye, Settings, ShieldAlert, MonitorOff, Monitor } from 'lucide-react';
import { useIdleDetection } from './hooks/useIdleDetection';
import { useBlinkTimer } from './hooks/useBlinkTimer';
import { useLocalStorage } from 'primereact/hooks';

export default function App() {
  const [workMinutes, setWorkMinutes] = useLocalStorage(20, 'blink_workMinutes');
  const [blinkSeconds, setBlinkSeconds] = useLocalStorage(20, 'blink_blinkSeconds');
  const [showSettings, setShowSettings] = useState(false);
  
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return ('Notification' in window) ? Notification.permission : 'default';
  });

  const { isIdle, requestPermission: requestIdlePermission, permissionGranted: idlePermissionGranted, isSupported: idleSupported } = useIdleDetection();

  const { timeLeft, mode, resetTimer } = useBlinkTimer(
    isIdle,
    workMinutes * 60 * 1000,
    blinkSeconds * 1000,
    notificationPermission === 'granted' && idlePermissionGranted
  );

  const handleRequestPermissions = async () => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      const p = await Notification.requestPermission();
      setNotificationPermission(p);
    }
    await requestIdlePermission();
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isSetupComplete = notificationPermission === 'granted' && idlePermissionGranted;

  const totalCurrentDuration = mode === 'work' ? workMinutes * 60 * 1000 : blinkSeconds * 1000;
  const progressValue = Math.round(((totalCurrentDuration - timeLeft) / totalCurrentDuration) * 100);

  return (
    <div className="flex flex-column align-items-center justify-content-center min-h-screen">
      <Card className="card-glass w-full max-w-2xl relative overflow-hidden">
        
        {/* Background glow effect based on mode */}
        <div style={{
          position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
          background: mode === 'work' ? 'radial-gradient(circle, var(--blue-500) 0%, transparent 60%)' : 'radial-gradient(circle, var(--green-500) 0%, transparent 60%)',
          opacity: 0.05, zIndex: 0, pointerEvents: 'none'
        }} />

        <div className="relative z-1">
          <div className="flex justify-content-between align-items-center mb-4">
            <h1 className="m-0 flex align-items-center gap-3 font-semibold text-3xl">
              <Eye size={36} className={mode === 'blink' ? 'pulse-animation text-green-500' : 'text-primary'} />
              Blink Reminder
            </h1>
            <Button 
              icon={<Settings size={20} />} 
              rounded text severity="secondary" 
              aria-label="Settings" 
              onClick={() => setShowSettings(!showSettings)}
            />
          </div>

          {!isSetupComplete && (
            <div className="surface-ground p-4 border-round-xl mb-4 border-1 border-300 flex flex-column align-items-center text-center">
              <ShieldAlert size={48} className="text-yellow-500 mb-3" />
              <h2 className="text-xl mt-0 mb-2">Permissions Required</h2>
              <p className="text-color-secondary mb-4 line-height-3 max-w-md">
                Blink needs Notification access to alert you, and {idleSupported ? 'Idle Detection' : 'Activity Tracking'} to know when you're away from the screen.
              </p>
              <Button label="Grant Permissions" icon="pi pi-check" onClick={handleRequestPermissions} />
            </div>
          )}

          {isSetupComplete && (
            <div className="flex flex-column align-items-center">
              <div className="flex gap-3 mb-4">
                 <Tag 
                   severity={isIdle ? 'warning' : 'success'} 
                   value={isIdle ? 'Idle / Screen Locked' : 'Active'} 
                   icon={isIdle ? <MonitorOff size={14} className="mr-2" /> : <Monitor size={14} className="mr-2" />} 
                   rounded
                   className="px-3 py-2 text-sm"
                 />
                 <Tag 
                   severity={mode === 'work' ? 'info' : 'success'} 
                   value={mode === 'work' ? 'Work Mode' : 'Blink Mode!'} 
                   rounded
                   className="px-3 py-2 text-sm"
                 />
              </div>

              <div className="relative flex justify-content-center align-items-center my-4">
                <Knob 
                  value={progressValue} 
                  size={250} 
                  strokeWidth={5}
                  showValue={false}
                  valueColor={mode === 'work' ? 'var(--blue-500)' : 'var(--green-500)'}
                  rangeColor="var(--surface-hover)"
                />
                <div className="absolute flex flex-column align-items-center text-center">
                  <span className="text-color-secondary text-sm font-medium uppercase tracking-widest mb-1">
                    {mode === 'work' ? (isIdle ? 'PAUSED' : 'TIME TO BLINK') : 'REST YOUR EYES'}
                  </span>
                  <span className="countdown-text m-0 line-height-1">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <Button label="Reset Timer" icon="pi pi-refresh" outlined onClick={resetTimer} />
              </div>
            </div>
          )}

          {showSettings && (
            <div className="mt-5 p-4 surface-ground border-round-xl border-1 border-300 fadein animation-duration-200">
              <h3 className="mt-0 mb-4 text-xl">Timer Settings</h3>
              <div className="grid">
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="workMinutes" className="font-medium text-color-secondary">Work Duration (minutes)</label>
                  <InputNumber 
                    inputId="workMinutes" 
                    value={workMinutes} 
                    onValueChange={(e) => setWorkMinutes(e.value || 20)} 
                    min={1} max={120} 
                    showButtons 
                    className="w-full"
                  />
                </div>
                <div className="col-12 md:col-6 flex flex-column gap-2">
                  <label htmlFor="blinkSeconds" className="font-medium text-color-secondary">Blink Duration (seconds)</label>
                  <InputNumber 
                    inputId="blinkSeconds" 
                    value={blinkSeconds} 
                    onValueChange={(e) => setBlinkSeconds(e.value || 20)} 
                    min={5} max={120} 
                    showButtons 
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
