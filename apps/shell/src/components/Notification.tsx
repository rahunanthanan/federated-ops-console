import React from 'react';
import { Banner } from '@platform/design-system';
import type { PlatformEvent } from '@platform/contracts';

type NotificationPayload = Extract<PlatformEvent, { type: 'notification.show' }>['payload'];

export function Notification({ notification, onDismiss }: {
  notification: NotificationPayload | null;
  onDismiss: () => void;
}) {
  if (!notification) return null;
  return (
    <div style={{ position: 'fixed', top: 16, right: 16, minWidth: 280, zIndex: 1000 }}>
      <Banner severity={notification.severity}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{notification.message}</span>
          <button onClick={onDismiss} aria-label="Dismiss notification" style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      </Banner>
    </div>
  );
}
