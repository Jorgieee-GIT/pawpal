/** Keyboard and swipe input use the same direction IDs as Rhythm Mixing: left, up, right, down. */
export function rhythmKeyDirection(key:string):number|null {
    switch (key) {
        case 'ArrowLeft': return 0;
        case 'ArrowUp': return 1;
        case 'ArrowRight': return 2;
        case 'ArrowDown': return 3;
        default: return null;
    }
}

/** Ignore tiny movements and ambiguous diagonal gestures. */
export function rhythmSwipeDirection(dx:number,dy:number,minDistance=42):number|null {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return null;
    const x=Math.abs(dx);
    const y=Math.abs(dy);
    if (Math.max(x,y)<minDistance) return null;
    if (x>y*1.15) return dx<0?0:2;
    if (y>x*1.15) return dy<0?1:3;
    return null;
}
