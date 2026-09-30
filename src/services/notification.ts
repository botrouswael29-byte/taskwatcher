// Notification, Vibration & Overlay Alert Service for Task Watcher
// Comprehensive support for Mobile Notification Shade (ستارة / القائمة المنسدلة) & Lock Screen (شاشة القفل)
import { ActiveOverlayReminder } from '../types';

export type NotificationChannel = 'reminders' | 'tasks' | 'supplements' | 'creatine' | 'water';

export interface ExtendedNotificationOptions extends NotificationOptions {
  channel?: NotificationChannel;
  hapticEnabled?: boolean;
  language?: 'en' | 'ar';
  data?: {
    id?: string;
    date?: string;
    type?: string;
    title?: string;
    language?: 'en' | 'ar';
    [key: string]: any;
  };
}

class NotificationService {
  private audioContext: AudioContext | null = null;
  private pipWindow: Window | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const result = await Notification.requestPermission();
      return result === 'granted';
    } catch {
      return false;
    }
  }

  /**
   * Short, subtle haptic vibration (Android modern haptics)
   * Respects user's Haptic Feedback setting (On/Off)
   */
  public vibrate(pattern: number | number[] = 25, hapticEnabled = true): void {
    if (!hapticEnabled) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern);
      }
    } catch (e) {
      // Haptics might be restricted or unsupported on some devices
    }
  }

  /**
   * Sound Chime
   */
  public playChime(type: 'task' | 'water' | 'reminder' | 'celebrate' = 'task') {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext || this.audioContext.state === 'suspended') {
        this.audioContext = new AudioCtx();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime;

      if (type === 'celebrate') {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.1);
          gain.gain.setValueAtTime(0.15, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.3);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.1);
          osc.stop(now + i * 0.1 + 0.35);
        });
      } else {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'triangle';

        osc1.frequency.setValueAtTime(587.33, now); // D5
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5

        osc2.frequency.setValueAtTime(880, now + 0.12);
        osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.25); // D6

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now + 0.1);
        osc1.stop(now + 0.2);
        osc2.stop(now + 0.4);
      }
    } catch (e) {
      // Audio autoplay policy
    }
  }

  /**
   * Display Android / System Notification with Action buttons ("Done", "Open")
   * Fully formatted for Mobile Notification Shade (القائمة المنسدلة) and Lock Screen (شاشة القفل)
   */
  public async notify(
    title: string,
    options?: ExtendedNotificationOptions,
    chime = true
  ): Promise<void> {
    if (chime) {
      this.playChime('reminder');
    }

    if (options?.hapticEnabled) {
      this.vibrate([100, 50, 100], true);
    }

    if (!this.isSupported() || Notification.permission !== 'granted') {
      return;
    }

    const isAr = options?.language === 'ar' || (typeof document !== 'undefined' && document.documentElement.lang === 'ar');

    // Action buttons visible directly on Lock Screen & Dropdown Shade
    const actionButtons = [
      {
        action: 'mark_done',
        title: isAr ? '✓ تم الإنجاز' : '✓ Done',
        icon: '/badge.svg',
      },
      {
        action: 'open_app',
        title: isAr ? '📱 فتح اليوم' : '📱 Open Day',
        icon: '/badge.svg',
      },
    ];

    const notifOptions: any = {
      icon: '/icon.svg',
      badge: '/badge.svg',
      tag: options?.tag || `tw-${Date.now()}`,
      renotify: true,
      timestamp: Date.now(),
      vibrate: options?.hapticEnabled ? [150, 60, 150, 60, 150] : undefined,
      // requireInteraction keeps notification in the mobile shade and lock screen until acted upon
      requireInteraction: options?.requireInteraction ?? true,
      actions: actionButtons,
      ...options,
      data: {
        ...(options?.data || {}),
        title,
        language: isAr ? 'ar' : 'en',
      },
    };

    // Priority 1: Service Worker registration (native Android lock screen & shade actions)
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(title, notifOptions);
          return;
        }
      }
    } catch (e) {
      console.warn('Service worker showNotification fallback:', e);
    }

    // Priority 2: Direct browser notification fallback
    try {
      new Notification(title, notifOptions);
    } catch (e) {
      console.warn('Direct Notification error:', e);
    }
  }

  /**
   * Test sending a Lock Screen & Notification Shade sample alert
   */
  public async testLockScreenNotification(language: 'en' | 'ar' = 'ar', hapticEnabled = true): Promise<void> {
    const isAr = language === 'ar';
    await this.notify(
      isAr ? 'Task Watcher — تذكير شاشة القفل والقائمة المنسدلة' : 'Task Watcher — Lock Screen & Notification Shade Alert',
      {
        body: isAr 
          ? '⏰ موعد جلسة التركيز وشرب الماء (500 مل) | يمكنك الضغط على "تم الإنجاز" مباشرة من شاشة القفل دون فتح التطبيق.' 
          : '⏰ Scheduled reminder: Time for focus and drinking water (500ml) | You can tap "Done" directly from lock screen.',
        language,
        hapticEnabled,
        tag: `tw-test-${Date.now()}`,
        requireInteraction: true,
        data: {
          id: 'test_reminder',
          title: isAr ? 'جلسة التركيز وشرب الماء' : 'Focus session & Hydration',
          type: 'reminder',
        },
      },
      true
    );
  }

  /**
   * Check whether system overlay / PiP capability is available
   */
  public isOverlaySupported(): boolean {
    return typeof window !== 'undefined' && 'documentPictureInPicture' in window;
  }

  /**
   * Show native PiP overlay over other apps if Document Picture-in-Picture is supported
   */
  public async showNativePipOverlay(
    reminder: ActiveOverlayReminder,
    onDone: () => void,
    onLater: () => void
  ): Promise<boolean> {
    if (!this.isOverlaySupported()) return false;
    try {
      // Close previous pip if open
      if (this.pipWindow && !this.pipWindow.closed) {
        this.pipWindow.close();
      }

      const pip = await (window as any).documentPictureInPicture.requestWindow({
        width: 320,
        height: 160,
      });
      this.pipWindow = pip;

      // Inject clean, dark green styling into PiP window
      pip.document.body.innerHTML = `
        <div style="
          margin: 0;
          padding: 14px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #14402a;
          color: white;
          border-radius: 18px;
          height: calc(100vh - 28px);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        ">
          <div>
            <div style="font-size: 11px; text-transform: uppercase; color: #a7f3d0; font-weight: 700; letter-spacing: 0.5px;">
              Task Watcher
            </div>
            <div style="font-size: 15px; font-weight: 800; margin-top: 4px; display: flex; align-items: center; gap: 6px;">
              <span>⏰</span> <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${reminder.title}</span>
            </div>
            <div style="font-size: 12px; color: #e2e8f0; margin-top: 2px;">
              ${reminder.subtitle || "It's time for your task"}
            </div>
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px;">
            <button id="pip-later" style="
              background: rgba(255,255,255,0.15);
              border: 1px solid rgba(255,255,255,0.25);
              color: white;
              padding: 6px 14px;
              border-radius: 10px;
              font-size: 12px;
              font-weight: 600;
              cursor: pointer;
            ">Later</button>
            <button id="pip-done" style="
              background: #10b981;
              border: none;
              color: #064e3b;
              padding: 6px 16px;
              border-radius: 10px;
              font-size: 12px;
              font-weight: 800;
              cursor: pointer;
            ">Done</button>
          </div>
        </div>
      `;

      const doneBtn = pip.document.getElementById('pip-done');
      const laterBtn = pip.document.getElementById('pip-later');

      doneBtn?.addEventListener('click', () => {
        onDone();
        pip.close();
      });

      laterBtn?.addEventListener('click', () => {
        onLater();
        pip.close();
      });

      // Auto close after 25s
      setTimeout(() => {
        if (!pip.closed) pip.close();
      }, 25000);

      return true;
    } catch (e) {
      console.warn('Native PiP overlay was not launched or user cancelled:', e);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
