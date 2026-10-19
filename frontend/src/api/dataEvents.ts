export const DATA_CHANGED_EVENT = 'ems:data-changed';

export function notifyDataChanged(): void {
  window.dispatchEvent(new Event(DATA_CHANGED_EVENT));
}
