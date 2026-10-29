import { useEffect, useRef } from 'react';
import PetArt from './PetArt';
import { BUILDING_ART, CACTUS_ART, VEHICLE_ART, JumpGuide, arcadeSpriteSrc } from './ArcadeArt';
import { ROAD_BOTTOM, ROAD_CENTER, ROAD_HORIZON, PLAYER_ROAD_Y, PLAYER_PASS_DEPTH, laneX, roadHalfWidth, trafficProjection, trafficIsVisible, trafficRowLanes } from './PawRunTraffic';

type ArcadeProps = {
    kind: 'dino' | 'runner';
    species?: string;
    color?: string;
    breed?: string;
    cosmetic?: string;
    onScore: (score: number) => void;
    onGameOver: () => void;
};

type Obstacle = {
    distance: number;
    lane: number;
    passed: boolean;
    variant: number;
};

export default function ArcadeCanvas({
    kind,
    species = 'cat',
    color = 'classic',
    breed = 'classic',
    cosmetic = 'none',
    onScore,
    onGameOver
}: ArcadeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const avatarRef = useRef<HTMLDivElement>(null);
    const callbacks = useRef({ onScore, onGameOver });
    callbacks.current = { onScore, onGameOver };

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;

        const ctx = context;
        const avatar = avatarRef.current;
        const width = 640;
        const heightPx = 340;
        canvas.width = width;
        canvas.height = heightPx;

        // Cache illustrations once per round, not once per frame.
        const loadArt = (documents: string[]) => documents.map(document => {
            const sprite = new Image();
            sprite.src = arcadeSpriteSrc(document);
            return sprite;
        });
        const cactusSprites = loadArt(CACTUS_ART);
        const vehicleSprites = loadArt(VEHICLE_ART);
        const buildingSprites = loadArt(BUILDING_ART);

        let last = 0;
        let elapsed = 0;
        let spawn = 0;
        let nextCactusSpawn = 1.6 + Math.random() * 0.7;
        let previousRowWasDouble = false;
        let score = 0;
        let ended = false;
        let requestId = 0;
        let jumpHeight = 0;
        let jumpVelocity = 0;
        let landing = 0;
        let playerLane = 1;
        let targetLane = 1;
        let obstacles: Obstacle[] = [];

        const jump = () => {
            if (kind === 'dino' && !ended && jumpHeight <= 0.1) {
                jumpVelocity = 690;
                jumpHeight = 1;
                landing = 0;
            }
        };
        const move = (direction: number) => {
            if (kind === 'runner' && !ended) {
                targetLane = Math.max(0, Math.min(2, targetLane + direction));
            }
        };

        const onKeyDown = (event: KeyboardEvent) => {
            if (['Space', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
                event.preventDefault();
            }
            if (event.repeat) return;
            if (event.code === 'Space' || event.code === 'ArrowUp') jump();
            if (event.code === 'ArrowLeft') move(-1);
            if (event.code === 'ArrowRight') move(1);
        };

        let touchStartX = 0;
        const onTouchStart = (event: TouchEvent) => {
            touchStartX = event.touches[0]?.clientX ?? 0;
        };
        const onTouchEnd = (event: TouchEvent) => {
            if (kind !== 'runner') return;
            const dx = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
            if (Math.abs(dx) > 20) move(dx > 0 ? 1 : -1);
        };
        const onPointerDown = (event: PointerEvent) => {
            if (kind === 'dino' && event.pointerType !== 'mouse' && event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
            if (kind === 'dino') jump();
        };

        // The space outside the modal also accepts mobile gestures.
        let outsideTouchId: number | null = null;
        let outsideStartX = 0;
        let outsideStartY = 0;
        const outsideStart = (event: TouchEvent) => {
            if (ended || !(event.target instanceof Element) || !event.target.classList.contains('overlay')) return;
            const finger = event.changedTouches[0];
            if (!finger) return;
            outsideTouchId = finger.identifier;
            outsideStartX = finger.clientX;
            outsideStartY = finger.clientY;
        };
        const outsideMove = (event: TouchEvent) => {
            if (outsideTouchId === null || kind !== 'runner') return;
            const finger = Array.from(event.changedTouches).find(touch => touch.identifier === outsideTouchId);
            if (finger && Math.abs(finger.clientX - outsideStartX) > 12) event.preventDefault();
        };
        const outsideEnd = (event: TouchEvent) => {
            if (outsideTouchId === null || ended) return;
            const finger = Array.from(event.changedTouches).find(touch => touch.identifier === outsideTouchId);
            if (!finger) return;
            outsideTouchId = null;
            if (kind === 'dino') {
                jump();
                return;
            }
            const dx = finger.clientX - outsideStartX;
            const dy = finger.clientY - outsideStartY;
            if (Math.abs(dx) > 24 && Math.abs(dx) > Math.abs(dy) * 1.15) move(dx > 0 ? 1 : -1);
        };
        const outsideCancel = () => {
            outsideTouchId = null;
        };

        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('touchstart', outsideStart, { passive: true });
        window.addEventListener('touchmove', outsideMove, { passive: false });
        window.addEventListener('touchend', outsideEnd, { passive: true });
        window.addEventListener('touchcancel', outsideCancel, { passive: true });
        canvas.addEventListener('touchstart', onTouchStart, { passive: true });
        canvas.addEventListener('touchend', onTouchEnd, { passive: true });
        canvas.addEventListener('pointerdown', onPointerDown);

        const rounded = (x: number, y: number, w: number, h: number, radius: number, color: string) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, radius);
            ctx.fill();
        };
        const drawCloud = (x: number, y: number, scale: number) => {
            ctx.fillStyle = '#fffafc';
            ctx.beginPath();
            ctx.ellipse(x, y, 40 * scale, 16 * scale, 0, 0, Math.PI * 2);
            ctx.ellipse(x - 20 * scale, y - 9 * scale, 20 * scale, 18 * scale, 0, 0, Math.PI * 2);
            ctx.ellipse(x + 10 * scale, y - 12 * scale, 25 * scale, 20 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        };
        const renderSprite = (image: HTMLImageElement, x: number, y: number, w: number, h: number, fallback: () => void) => {
            if (image.complete && image.naturalWidth > 0) {
                ctx.drawImage(image, x, y, w, h);
            } else {
                fallback();
            }
        };

        const render = (time: number) => {
            if (ended) return;
            const dt = Math.min(0.034, (time - last) / 1000 || 0);
            last = time;
            elapsed += dt;
            const speed = kind === 'dino' ? 178 + Math.min(302, elapsed * 5.3) : 0.39 + Math.min(0.55, elapsed * 0.012);

            const sky = ctx.createLinearGradient(0, 0, 0, heightPx);
            sky.addColorStop(0, kind === 'dino' ? '#bce7ef' : '#dcecf5');
            sky.addColorStop(1, kind === 'dino' ? '#ffe6d1' : '#fff2f4');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, width, heightPx);
            for (let index = 0; index < 4; index++) {
                const x = ((index * 220 - elapsed * 16) % (width + 220) + width + 220) % (width + 220) - 50;
                drawCloud(x, 55 + (index % 2) * 32, 0.7 + (index % 2) * 0.25);
            }

            if (kind === 'dino') {
                // Sunny pastel desert with layered mesas, distant dunes and a grounded running path.
                ctx.fillStyle = '#ffeab5';
                ctx.beginPath();
                ctx.arc(535, 78, 35, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#e4bbab';
                for (const [x, y, w, h] of [[20, 178, 114, 59], [390, 173, 139, 61], [558, 192, 75, 45]]) {
                    rounded(x, y, w, h, 21, '#e4bbab');
                    rounded(x + w * 0.18, y - 22, w * 0.6, 34, 13, '#e4bbab');
                    rounded(x + w * 0.22, y - 23, w * 0.53, 8, 3, '#f2d5b6');
                }
                ctx.fillStyle = '#f6d2b6';
                ctx.beginPath();
                ctx.moveTo(0, 253);
                ctx.quadraticCurveTo(115, 214, 264, 253);
                ctx.quadraticCurveTo(460, 215, 640, 245);
                ctx.lineTo(640, 340);
                ctx.lineTo(0, 340);
                ctx.fill();
                ctx.fillStyle = '#e6c6b3';
                ctx.beginPath();
                ctx.moveTo(0, 268);
                ctx.quadraticCurveTo(175, 252, 305, 270);
                ctx.quadraticCurveTo(470, 242, 640, 265);
                ctx.lineTo(640, 340);
                ctx.lineTo(0, 340);
                ctx.fill();
                rounded(0, 276, width, 64, 0, '#f4dfc6');
                rounded(0, 275, width, 4, 0, '#c7b59c');
                for (let index = 0; index < 15; index++) {
                    const x = ((index * 67 - elapsed * speed * 0.6) % 750 + 750) % 750;
                    rounded(x, 316 + (index % 3) * 5, 24, 3, 2, '#dfb99d');
                }
            } else {
                ctx.fillStyle = '#a7d2b4';
                ctx.beginPath();
                ctx.ellipse(100, 290, 210, 110, 0, 0, Math.PI * 2);
                ctx.ellipse(530, 290, 250, 115, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            if (kind === 'dino') {
                if (jumpHeight > 0) {
                    jumpHeight = Math.max(0, jumpHeight + jumpVelocity * dt);
                    jumpVelocity -= 1800 * dt;
                    if (jumpHeight === 0) {
                        landing = 1;
                        jumpVelocity = 0;
                    }
                }
                landing = Math.max(0, landing - dt * 4);
                // Spawn one random cactus at a time. Difficulty comes from travel speed,
                // not increasingly dense obstacle rows that become impossible to clear.
                spawn += dt;
                if (spawn >= nextCactusSpawn) {
                    spawn = 0;
                    nextCactusSpawn = 1.6 + Math.random() * 0.8;
                    obstacles.push({
                        distance: 680,
                        lane: 0,
                        passed: false,
                        variant: Math.floor(Math.random() * cactusSprites.length)
                    });
                }
                for (const obstacle of obstacles) {
                    obstacle.distance -= speed * dt;
                    renderSprite(cactusSprites[obstacle.variant], obstacle.distance - 8, 218, 46, 62, () => {
                        rounded(obstacle.distance, 224, 24, 52, 9, '#86bba4');
                    });
                    if (obstacle.distance < 105 && obstacle.distance > 72 && jumpHeight < 42) {
                        ended = true;
                        callbacks.current.onGameOver();
                        break;
                    }
                    if (obstacle.distance < 70 && !obstacle.passed) {
                        obstacle.passed = true;
                        score += 15;
                        callbacks.current.onScore(score);
                    }
                }
                obstacles = obstacles.filter(obstacle => obstacle.distance > -50);
                if (avatar) {
                    avatar.style.left = `${82 / 640 * 100}%`;
                    avatar.style.top = `${(276 - jumpHeight - 68) / 340 * 100}%`;
                    avatar.style.width = `${76 / 640 * 100}%`;
                    avatar.style.transform = `translateX(-50%) scale(${1 - landing * 0.07})`;
                }
            } else {
                // One road model for the visible asphalt, lane dividers, parked
                // scenery and approaching traffic: never extrapolate cars outside it.
                const horizon = ROAD_HORIZON;
                const bottom = ROAD_BOTTOM;
                const center = ROAD_CENTER;

                // Pastel neighborhood: buildings stay beyond the edge of the road.
                // The foreground is drawn before the roadway and never overlaps traffic.
                ctx.fillStyle = '#c8e0c8';
                ctx.fillRect(0, horizon, width, bottom - horizon);
                const blockShift = (elapsed * speed * 0.27) % 1;
                for (let index = 0; index < 7; index++) {
                    const depth = (index / 7 + blockShift) % 1;
                    const position = depth * depth;
                    const anchorY = horizon + position * (bottom - horizon);
                    const buildingWidth = 30 + position * 92;
                    const buildingHeight = buildingWidth * 1.27;
                    for (const side of [-1, 1]) {
                        const edge = center + side * roadHalfWidth(anchorY);
                        const setback = 7 + position * 22;
                        const x = side < 0 ? edge - setback - buildingWidth : edge + setback;
                        const artIndex = (index + (side === -1 ? 0 : 2)) % buildingSprites.length;
                        renderSprite(buildingSprites[artIndex], x, anchorY - buildingHeight, buildingWidth, buildingHeight, () => {
                            rounded(x, anchorY - buildingHeight, buildingWidth, buildingHeight, 6, '#f5d5df');
                        });
                    }
                }

                // Pavement, pale edging and a straight three-lane highway.
                ctx.fillStyle = '#c3acb8';
                ctx.beginPath();
                ctx.moveTo(center - 53, horizon);
                ctx.lineTo(center + 53, horizon);
                ctx.lineTo(623, bottom);
                ctx.lineTo(17, bottom);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#9d8999';
                ctx.beginPath();
                ctx.moveTo(center - 44, horizon);
                ctx.lineTo(center + 44, horizon);
                ctx.lineTo(center + roadHalfWidth(bottom), bottom);
                ctx.lineTo(center - roadHalfWidth(bottom), bottom);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = '#fff7ec';
                ctx.lineWidth = 3;
                for (const side of [-1, 1]) {
                    ctx.beginPath();
                    ctx.moveTo(center + side * roadHalfWidth(horizon), horizon);
                    ctx.lineTo(center + side * roadHalfWidth(bottom), bottom);
                    ctx.stroke();
                }
                // Dash segments grow naturally with perspective and stay in their lanes.
                ctx.lineCap = 'round';
                ctx.strokeStyle = '#fff4e9';
                for (const divider of [1, 2]) {
                    for (let index = 0; index < 11; index++) {
                        const position = (index / 11 + elapsed * speed * 0.22) % 1;
                        const y1 = horizon + position * position * (bottom - horizon);
                        const y2 = Math.min(bottom, y1 + 5 + position * 23);
                        const boundaryX = (y: number) => center + (divider - 1.5) * roadHalfWidth(y) * (2 / 3);
                        ctx.lineWidth = 1.7 + position * 4;
                        ctx.beginPath();
                        ctx.moveTo(boundaryX(y1), y1);
                        ctx.lineTo(boundaryX(y2), y2);
                        ctx.stroke();
                    }
                }

                playerLane += (targetLane - playerLane) * Math.min(1, dt * 12);
                spawn += dt;
                // A row can contain one car or two cars side by side. Paired
                // cars never fill all three lanes, and the next row is delayed
                // slightly so players have time to move into the open lane.
                const rowInterval = Math.max(1.05, 1.65 - elapsed * 0.012) +
                    (previousRowWasDouble ? 0.28 : 0);
                if (spawn > rowInterval) {
                    spawn = 0;
                    const occupiedLanes = trafficRowLanes();
                    previousRowWasDouble = occupiedLanes.length === 2;

                    for (const lane of occupiedLanes) {
                        obstacles.push({
                            distance: 0,
                            lane,
                            passed: false,
                            variant: Math.floor(Math.random() * vehicleSprites.length)
                        });
                    }
                }
                // Paint the distant cars first, so nearby traffic naturally
                // passes in front of them instead of popping over one another.
                obstacles.sort((first, second) => first.distance - second.distance);
                for (const obstacle of obstacles) {
                    obstacle.distance += speed * dt;
                    const vehicle = trafficProjection(obstacle.lane, obstacle.distance);

                    // Anchor the front bumper to the lane at its road position.
                    // Rotation then points the roof toward the vanishing point:
                    // left/right cars follow the diagonal lanes instead of
                    // remaining upright or drifting toward the road's center.
                    ctx.save();
                    ctx.translate(vehicle.x, vehicle.y);
                    ctx.rotate(vehicle.angle);
                    renderSprite(
                        vehicleSprites[obstacle.variant],
                        -vehicle.width / 2,
                        -vehicle.height,
                        vehicle.width,
                        vehicle.height,
                        () => rounded(-vehicle.width / 2, -vehicle.height, vehicle.width, vehicle.height, 8, '#b6a4e4')
                    );
                    ctx.restore();

                    // Check contact when the car actually reaches the player's
                    // road position, using the displayed (interpolated) lane.
                    // Safe cars remain visible as they drive below the player
                    // and completely off the bottom of the canvas.
                    if (obstacle.distance >= PLAYER_PASS_DEPTH && !obstacle.passed) {
                        obstacle.passed = true;
                        if (Math.abs(playerLane - obstacle.lane) < 0.48) {
                            ended = true;
                            callbacks.current.onGameOver();
                            break;
                        }
                        score += 15;
                        callbacks.current.onScore(score);
                    }
                }
                obstacles = obstacles.filter(obstacle => trafficIsVisible(obstacle.lane, obstacle.distance));
                const petX = laneX(playerLane, PLAYER_ROAD_Y);
                ctx.fillStyle = '#7c6377';
                ctx.beginPath();
                ctx.ellipse(petX, 307, 29, 9, 0, 0, Math.PI * 2);
                ctx.fill();
                if (avatar) {
                    avatar.style.left = `${petX / 640 * 100}%`;
                    avatar.style.top = `${(301 - 101 + Math.sin(elapsed * 15) * 3) / 340 * 100}%`;
                    avatar.style.width = `${112 / 640 * 100}%`;
                    avatar.style.transform = 'translateX(-50%)';
                }
            }

            if (!ended) requestId = requestAnimationFrame(render);
        };

        requestId = requestAnimationFrame(render);
        return () => {
            ended = true;
            cancelAnimationFrame(requestId);
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('touchstart', outsideStart);
            window.removeEventListener('touchmove', outsideMove);
            window.removeEventListener('touchend', outsideEnd);
            window.removeEventListener('touchcancel', outsideCancel);
            canvas.removeEventListener('touchstart', onTouchStart);
            canvas.removeEventListener('touchend', onTouchEnd);
            canvas.removeEventListener('pointerdown', onPointerDown);
        };
    }, [kind]);

    return (
        <div className="polished-arcade">
            <div className="arcade-stage">
                <canvas ref={canvasRef} aria-label={kind === 'dino' ? 'Jump over spiky cacti' : 'Dodge colorful cars on the three-lane road'} />
                <div className="arcade-pet-avatar" ref={avatarRef}>
                    <PetArt species={species} color={color} breed={breed} cosmetic={cosmetic} />
                </div>
                {kind === 'dino' && <div className="paw-jump-guide"><JumpGuide /></div>}
            </div>
            <p className="paw-arcade-gesture-hint">
                {kind === 'dino'
                    ? 'Tap the game or press Space to jump.'
                    : 'Swipe left or right, or use the arrow keys to dodge.'}
            </p>
        </div>
    );
}
