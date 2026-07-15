'use strict';

//scroll animation

(function () {
    // 기준점: 요소 하단 - 요소 높이/2 (화면 하단 기준)
    jQuery.fn.motionA = function () {
        const targetPoint = this.offset().top + this.outerHeight() / 2;
        const viewportBottom = $(window).scrollTop() + $(window).height();

        this.toggleClass('motion__in', viewportBottom > targetPoint);
    };

    // 기준점: 요소 상단 (화면 중앙 기준, .fast 요소용 - 좀 더 빠르게 노출)
    jQuery.fn.motionB = function () {
        const targetPoint = this.offset().top;
        const viewportCenter = $(window).scrollTop() + $(window).height() / 2;

        this.toggleClass('motion__in', viewportCenter > targetPoint);
    };

    function runScrollAnimation() {
        $('[data-ani]:not(.fast)').each(function () {
            $(this).motionA();
        });

        $('[data-ani].fast').each(function () {
            $(this).motionB();
        });
    }

    $(function () {
        runScrollAnimation();
        $(window).on('scroll', runScrollAnimation);
    });
})();


$(function () {
    $('.topBtn').on('click', function () {
        $('html, body').animate({ scrollTop: 0 }, 400);
        return false;
    });
});


// cursor custom
$(function () {
    $('.projectList .prThum').hover(
        function () {
            $('.cursor-small').addClass('more');
        },
        function () {
            $('.cursor-small').removeClass('more');
        }
    );
});

function initCustomCursor() {
    const innerCursor = document.querySelector('.cursor-small');
    const canvas = document.querySelector('.cursor-canvas');

    let clientX = -100;
    let clientY = -100;
    let lastX = 0;
    let lastY = 0;
    let isStuck = false;
    let stuckX, stuckY;
    let group;

    // 마우스 좌표를 추적하고 커서를 매 프레임 해당 위치로 이동
    function trackCursorPosition() {
        document.addEventListener('mousemove', (e) => {
            clientX = e.clientX;
            clientY = e.clientY;
        });

        const render = () => {
            TweenMax.set(innerCursor, { x: clientX, y: clientY });
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    }

    function initNoiseShape() {
        const shapeBounds = { width: 75, height: 75 };
        const strokeColor = 'rgba(0,0,0,.08)';
        const strokeWidth = 1;
        const segments = 8;
        const radius = 15;
        const noiseScale = 150;
        const noiseRange = 6;

        let isNoisy = false;
        let bigCoordinates = [];

        paper.setup(canvas);

        const polygon = new paper.Path.RegularPolygon(new paper.Point(0, 0), segments, radius);
        polygon.strokeColor = strokeColor;
        polygon.strokeWidth = strokeWidth;
        polygon.smooth();

        group = new paper.Group([polygon]);
        group.applyMatrix = false;

        const noiseObjects = polygon.segments.map(() => new SimplexNoise());
        const lerp = (a, b, n) => (1 - n) * a + n * b;
        const map = (value, inMin, inMax, outMin, outMax) =>
            ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

        paper.view.onFrame = (event) => {
            // 커서 위치 이동 
            if (isStuck) {
                lastX = lerp(lastX, stuckX, 0.08);
                lastY = lerp(lastY, stuckY, 0.08);
            } else {
                lastX = lerp(lastX, clientX, 0.2);
                lastY = lerp(lastY, clientY, 0.2);
            }
            group.position = new paper.Point(lastX, lastY);

            // 고정 상태일 때 확대, 아닐 때 축소
            if (isStuck && polygon.bounds.width < shapeBounds.width) {
                polygon.scale(1.15);
            } else if (!isStuck && polygon.bounds.width > 30) {
                if (isNoisy) {
                    polygon.segments.forEach((segment, i) => {
                        segment.point.set(bigCoordinates[i][0], bigCoordinates[i][1]);
                    });
                    isNoisy = false;
                    bigCoordinates = [];
                }
                polygon.scale(0.92);
            }

            // 고정 + 확대된 상태에서만 노이즈로 도형 왜곡
            if (isStuck && polygon.bounds.width >= shapeBounds.width) {
                isNoisy = true;

                if (bigCoordinates.length === 0) {
                    polygon.segments.forEach((segment, i) => {
                        bigCoordinates[i] = [segment.point.x, segment.point.y];
                    });
                }

                polygon.segments.forEach((segment, i) => {
                    const noiseX = noiseObjects[i].noise2D(event.count / noiseScale, 0);
                    const noiseY = noiseObjects[i].noise2D(event.count / noiseScale, 1);
                    const distortionX = map(noiseX, -1, 1, -noiseRange, noiseRange);
                    const distortionY = map(noiseY, -1, 1, -noiseRange, noiseRange);

                    segment.point.set(
                        bigCoordinates[i][0] + distortionX,
                        bigCoordinates[i][1] + distortionY
                    );
                });
            }

            polygon.smooth();
        };
    }

    // 프로젝트 썸네일에 마우스를 올렸을 때 커서 확대 연출
    function initHoverEffects() {
        const handleMouseEnter = () => {
            TweenMax.to(innerCursor, 1, { background: '#fff', width: 100, height: 100, ease: Expo.easeOut });
        };
        const handleMouseLeave = () => {
            isStuck = false;
            TweenMax.to(innerCursor, 1, { background: '#ff7400', width: 20, height: 20, ease: Expo.easeOut });
        };

        document.querySelectorAll('.projectList .prThum').forEach((link) => {
            link.addEventListener('mouseenter', handleMouseEnter);
            link.addEventListener('mouseleave', handleMouseLeave);
        });
    }

    trackCursorPosition();
    initNoiseShape();
    initHoverEffects();
}

// WebGL animation 
function initBackgroundCanvas() {
    const BG_SRC = 'images/background.png';

    const canvas = document.getElementById('c');
    const gl = canvas.getContext('webgl2');

    if (!gl) {
        document.body.innerHTML = '<p style="color:white;padding:2rem">WebGL2 미지원 브라우저입니다.</p>';
        return;
    }

    const mouse = { x: 0.5, y: 0.5 };
    const sm = { x: 0.5, y: 0.5 };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX / innerWidth;
        mouse.y = 1.0 - e.clientY / innerHeight;
    });

    let fbA, fbB;

    function resize() {
        const dpr = Math.min(devicePixelRatio || 1, 1.5);
        canvas.width = Math.round(innerWidth * dpr);
        canvas.height = Math.round(innerHeight * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
        if (fbA) rebuildFBOs();
    }
    window.addEventListener('resize', resize);

    function compile(type, src) {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
    }

    function mkProg(v, f) {
        const p = gl.createProgram();
        gl.attachShader(p, compile(gl.VERTEX_SHADER, v));
        gl.attachShader(p, compile(gl.FRAGMENT_SHADER, f));
        gl.linkProgram(p);
        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        return p;
    }

    /* ---------- Shaders ---------- */

    const VERT = `#version 300 es
    in vec2 aPos; out vec2 vUV;
    void main() { vUV = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

    const BG_VERT = `#version 300 es
    in vec2 aPos; out vec2 vUV;
    uniform vec2 uMouse;
    void main() {
    vUV = aPos * 0.5 + 0.5;
    float ax = (uMouse.y - 0.5) * 0.18;
    float ay = (uMouse.x - 0.5) * -0.18;
    mat3 rx = mat3(1,0,0, 0,cos(ax),-sin(ax), 0,sin(ax),cos(ax));
    mat3 ry = mat3(cos(ay),0,sin(ay), 0,1,0, -sin(ay),0,cos(ay));
    vec3 p = rx * ry * vec3(aPos * 1.12, 1.0);
    gl_Position = vec4(p.xy, 0.0, 1.0);
    }`;

    const BG_FRAG = `#version 300 es
    precision highp float;
    in vec2 vUV; uniform sampler2D uTex; out vec4 o;
    void main() { o = texture(uTex, vUV); }`;

    const GRAD_FRAG = `#version 300 es
    precision highp float;
    in vec2 vUV; out vec4 o;
    void main() { o = vec4(0.039, 0.039, 0.039, 1.0); }`;

    const FLOW_FRAG = `#version 300 es
    precision highp float;
    in vec2 vUV;
    uniform sampler2D uTex;
    uniform float uTime;
    uniform vec2 uMouse;
    uniform vec2 uRes;

    vec3 hash33(vec3 p3) {
    p3 = fract(p3 * vec3(0.1031,0.11369,0.13787));
    p3 += dot(p3, p3.yxz + 19.19);
    return -1.0 + 2.0 * fract(vec3((p3.x+p3.y)*p3.z,(p3.x+p3.z)*p3.y,(p3.y+p3.z)*p3.x));
    }
    float pnoise(vec3 p) {
    vec3 pi=floor(p), pf=p-pi, w=pf*pf*(3.0-2.0*pf);
    float n000=dot(pf-vec3(0,0,0),hash33(pi+vec3(0,0,0)));
    float n100=dot(pf-vec3(1,0,0),hash33(pi+vec3(1,0,0)));
    float n010=dot(pf-vec3(0,1,0),hash33(pi+vec3(0,1,0)));
    float n110=dot(pf-vec3(1,1,0),hash33(pi+vec3(1,1,0)));
    float n001=dot(pf-vec3(0,0,1),hash33(pi+vec3(0,0,1)));
    float n101=dot(pf-vec3(1,0,1),hash33(pi+vec3(1,0,1)));
    float n011=dot(pf-vec3(0,1,1),hash33(pi+vec3(0,1,1)));
    float n111=dot(pf-vec3(1,1,1),hash33(pi+vec3(1,1,1)));
    return mix(mix(mix(n000,n100,w.x),mix(n010,n110,w.x),w.y),
                mix(mix(n001,n101,w.x),mix(n011,n111,w.x),w.y),w.z);
    }

    const float PI = 3.14159265359;
    out vec4 o;
    void main() {
    vec2 st = vUV;
    float ar = uRes.x / max(uRes.y, 0.001);
    vec2 av = vec2(ar, 1.0);
    vec2 mPos = vec2(0.5) + (uMouse - 0.5);
    float sprd = 0.168 / ((ar + 1.0) / 2.0);
    float amt = 0.02;
    vec2 invPos = 1.0 - mPos;
    float freq = 5.0 * sprd;
    float t = 0.95 + uTime * 0.0166;
    float rad = 360.0 * 5.994 * PI / 180.0;
    for (int i = 0; i < 8; i++) {
        vec2 cs = clamp(st, -1.0, 2.0);
        vec2 sc = (cs - 0.5) * av + invPos;
        float pn = pnoise(vec3((sc - 0.5) * freq, t)) - 0.5;
        st += vec2(cos(pn * rad), sin(pn * rad)) * amt;
    }
    o = texture(uTex, mix(vUV, clamp(st, 0.0, 1.0), 0.51));
    }`;

    const BLUR_FRAG = `#version 300 es
    precision highp float;
    in vec2 vUV;
    uniform sampler2D uTex;
    uniform vec2 uRes;
    uniform int uDir;
    float gw(int i) {
    float w[36];
    w[0]=0.00094768;w[1]=0.00151965;w[2]=0.00237008;w[3]=0.00359517;
    w[4]=0.0053041;w[5]=0.00761097;w[6]=0.01062197;w[7]=0.01441804;
    w[8]=0.01903459;w[9]=0.0244409;w[10]=0.03052299;w[11]=0.03707432;
    w[12]=0.04379813;w[13]=0.05032389;w[14]=0.05623791;w[15]=0.06112521;
    w[16]=0.06461716;w[17]=0.06643724;w[18]=0.06643724;w[19]=0.06461716;
    w[20]=0.06112521;w[21]=0.05623791;w[22]=0.05032389;w[23]=0.04379813;
    w[24]=0.03707432;w[25]=0.03052299;w[26]=0.0244409;w[27]=0.01903459;
    w[28]=0.01441804;w[29]=0.01062197;w[30]=0.00761097;w[31]=0.0053041;
    w[32]=0.00359517;w[33]=0.00237008;w[34]=0.00151965;w[35]=0.00094768;
    return w[i];
    }
    out vec4 o;
    void main() {
    vec2 uv = vUV;
    float amt = 0.5 * 6.0 * length(uv - vec2(0.5)) * 1.32;
    vec2 dir = uDir == 1 ? vec2(0.0, uRes.x/uRes.y) : vec2(1.0, 0.0);
    vec4 col = texture(uTex, uv) * gw(0);
    for (int i = 0; i < 36; i++) {
        float x = float(i - 18) * amt;
        col += texture(uTex, uv + vec2(x * 0.001) * dir) * gw(i);
    }
    o = col;
    }`;

    const qbuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, qbuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);

    function bindQ(prog) {
        gl.bindBuffer(gl.ARRAY_BUFFER, qbuf);
        const loc = gl.getAttribLocation(prog, 'aPos');
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    function makeFBO() {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR));
        [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));

        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        return { fb, tex };
    }

    function rebuildFBOs() {
        [fbA, fbB].forEach((f) => {
            gl.deleteTexture(f.tex);
            gl.deleteFramebuffer(f.fb);
        });
        fbA = makeFBO();
        fbB = makeFBO();
    }

    const pGrad = mkProg(VERT, GRAD_FRAG);
    const pBg = mkProg(BG_VERT, BG_FRAG);
    const pFlow = mkProg(VERT, FLOW_FRAG);
    const pBlur = mkProg(VERT, BLUR_FRAG);

    const U = {
        bgM: gl.getUniformLocation(pBg, 'uMouse'),
        bgT: gl.getUniformLocation(pBg, 'uTex'),
        fT: gl.getUniformLocation(pFlow, 'uTex'),
        fTi: gl.getUniformLocation(pFlow, 'uTime'),
        fM: gl.getUniformLocation(pFlow, 'uMouse'),
        fR: gl.getUniformLocation(pFlow, 'uRes'),
        bT: gl.getUniformLocation(pBlur, 'uTex'),
        bR: gl.getUniformLocation(pBlur, 'uRes'),
        bD: gl.getUniformLocation(pBlur, 'uDir'),
    };

    let bgTex = null;
    const img = new Image();
    img.onload = () => {
        bgTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, bgTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.LINEAR));
        [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
    };
    img.src = BG_SRC;

    fbA = makeFBO();
    fbB = makeFBO();
    resize();

    function bt(tex, unit) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
    }

    const t0 = performance.now();

    function render(now) {
        const time = (now - t0) / 1000;
        sm.x += (mouse.x - sm.x) * 0.06;
        sm.y += (mouse.y - sm.y) * 0.06;
        const W = canvas.width;
        const H = canvas.height;

        // Pass 0: 검정 배경 → fbA
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbA.fb);
        gl.viewport(0, 0, W, H);
        gl.useProgram(pGrad);
        bindQ(pGrad);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Pass 1: 배경 이미지 3D 틸팅 → fbA (blend)
        if (bgTex) {
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.useProgram(pBg);
            bindQ(pBg);
            bt(bgTex, 0);
            gl.uniform1i(U.bgT, 0);
            gl.uniform2f(U.bgM, sm.x, sm.y);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.disable(gl.BLEND);
        }

        // Pass 2: flow field fbA → fbB
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbB.fb);
        gl.viewport(0, 0, W, H);
        gl.useProgram(pFlow);
        bindQ(pFlow);
        bt(fbA.tex, 0);
        gl.uniform1i(U.fT, 0);
        gl.uniform1f(U.fTi, time);
        gl.uniform2f(U.fM, sm.x, sm.y);
        gl.uniform2f(U.fR, W, H);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Pass 3: 가로 블러 fbB → fbA
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbA.fb);
        gl.viewport(0, 0, W, H);
        gl.useProgram(pBlur);
        bindQ(pBlur);
        bt(fbB.tex, 0);
        gl.uniform1i(U.bT, 0);
        gl.uniform2f(U.bR, W, H);
        gl.uniform1i(U.bD, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        // Pass 4: 세로 블러 fbA → 화면
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, W, H);
        gl.useProgram(pBlur);
        bindQ(pBlur);
        bt(fbA.tex, 0);
        gl.uniform1i(U.bT, 0);
        gl.uniform2f(U.bR, W, H);
        gl.uniform1i(U.bD, 1);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

window.addEventListener('load', () => {
    initCustomCursor();
    initBackgroundCanvas();
});
