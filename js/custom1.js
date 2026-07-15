/* 
 * custom js Document
*/ 

$(function(){
	scrollAni();	
});


$(document).ready(function(){
    $(".topBtn").click(function () {
        $('html, body').animate({
            scrollTop: 0
        }, 400);
        return false;
    });
});


$(function () {
    $(".projectList .prThum").hover(function () {
        $(".cursor-small").addClass("more");
    }, function () {
        $(".cursor-small").removeClass("more");
    });
});

const cursorModule = () => {
    const innerCursor = document.querySelector(".cursor-small");
    const canvas = document.querySelector(".cursor-canvas");
    let clientX = -100;
    let clientY = -100;

    const initCursor = () => {
        document.addEventListener("mousemove", e => {
            clientX = e.clientX;
            clientY = e.clientY;
        });
        const render = () => {
            TweenMax.set(innerCursor, {
                x: clientX,
                y: clientY
            });
            requestAnimationFrame(render);
        };
        requestAnimationFrame(render);
    };

    initCursor();
    let lastX = 0;
    let lastY = 0;
    let isStuck = false;
    let showCursor = false;
    let group;
    let stuckX;
    let stuckY;
    let fillOuterCursor;

    const initCanvas = () => {
        const shapeBounds = {
            width: 75,
            height: 75,
        };
        paper.setup(canvas);
        const strokeColor = 'rgba(0,0,0,.08)';
        const strokeWidth = 1;
        const segments = 8;
        const radius = 15;
        const noiseScale = 150;
        const noiseRange = 6;
        let isNoisy = false;
        const polygon = new paper.Path.RegularPolygon(
            new paper.Point(0, 0),
            segments,
            radius,
        );
        polygon.strokeColor = strokeColor;
        polygon.strokeWidth = strokeWidth;
        polygon.smooth();
        group = new paper.Group([polygon]);
        group.applyMatrix = false;

        const noiseObjects = polygon.segments.map(() => new SimplexNoise());
        let bigCoordinates = [];
        const lerp = (a, b, n) => {
            return (1 - n) * a + n * b;
        };
        const map = (value, in_min, in_max, out_min, out_max) => {
            return (
                ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
            );
        };
        paper.view.onFrame = event => {
            if (!isStuck) {
                // move circle around normally
                lastX = lerp(lastX, clientX, 0.2);
                lastY = lerp(lastY, clientY, 0.2);
                group.position = new paper.Point(lastX, lastY);
            } else if (isStuck) {
                // fixed position on a nav item
                lastX = lerp(lastX, stuckX, 0.08);
                lastY = lerp(lastY, stuckY, 0.08);
                group.position = new paper.Point(lastX, lastY);
            }
            if (isStuck && polygon.bounds.width < shapeBounds.width) {
                // scale up the shape
                polygon.scale(1.15);
            } else if (!isStuck && polygon.bounds.width > 30) {
                // remove noise
                if (isNoisy) {
                    polygon.segments.forEach((segment, i) => {
                        segment.point.set(bigCoordinates[i][0], bigCoordinates[i][1]);
                    });
                    isNoisy = false;
                    bigCoordinates = [];
                }
                // scale down the shape
                const scaleDown = 0.92;
                polygon.scale(scaleDown);
            }
            // while stuck and big, apply simplex noise
            if (isStuck && polygon.bounds.width >= shapeBounds.width) {
                isNoisy = true;
                // first get coordinates of large circle
                if (bigCoordinates.length === 0) {
                    polygon.segments.forEach((segment, i) => {
                        bigCoordinates[i] = [segment.point.x, segment.point.y];
                    });
                }
                // loop over all points of the polygon
                polygon.segments.forEach((segment, i) => {
                    // get new noise value
                    // we divide event.count by noiseScale to get a very smooth value
                    const noiseX = noiseObjects[i].noise2D(event.count / noiseScale, 0);
                    const noiseY = noiseObjects[i].noise2D(event.count / noiseScale, 1);
                    // map the noise value to our defined range
                    const distortionX = map(noiseX, -1, 1, -noiseRange, noiseRange);
                    const distortionY = map(noiseY, -1, 1, -noiseRange, noiseRange);
                    // apply distortion to coordinates
                    const newX = bigCoordinates[i][0] + distortionX;
                    const newY = bigCoordinates[i][1] + distortionY;
                    // set new (noisy) coordindate of point
                    segment.point.set(newX, newY);
                });
            }
            polygon.smooth();
        }
    }
    initCanvas();


    const initCursorHovers = () => {

        const handleCanvasCursorMouseEnter = e => {
            TweenMax.to(innerCursor, 1, { background: '#fff', width: 100, height: 100, ease: Expo.easeOut });
        };

        const handleCanvasCursorMouseLeave = () => {
            isStuck = false;
            TweenMax.to(innerCursor, 1, { background: '#ff7400', width: 20, height: 20, ease: Expo.easeOut });
        };

        //sub-portfolio grid-item hover 일때
        const $links = document.querySelectorAll('.projectList .prThum');
        $links.forEach(link => {
            link.addEventListener("mouseenter", handleCanvasCursorMouseEnter);
            link.addEventListener("mouseleave", handleCanvasCursorMouseLeave);
        });

    }
    initCursorHovers();
}

window.onload = () => {
    cursorModule();
}

// animation
function scrollAni(){
	jQuery.fn.motionA = function(){
		var bottom_of_object = this.offset().top + this.outerHeight()/2;
		var bottom_of_window = $(window).scrollTop() + $(window).height();
		
		if( bottom_of_window > bottom_of_object ){                
			this.addClass("motion__in");	                    
		}else{
			this.removeClass('motion__in');
		}	
	}
	
	jQuery.fn.motionB = function(){
		var bottom_of_object = this.offset().top;
		var bottom_of_window = $(window).scrollTop() + $(window).height()/2;
		
		if( bottom_of_window > bottom_of_object ){                
			this.addClass("motion__in");	                    
		}else{
			this.removeClass('motion__in');
		}
	}
	
	$('[data-ani]:not(.fast)').each( function(i){		
		let $el = $(this);
		$el.motionA();
	}); 
	
	$('[data-ani].fast').each( function(i){		
		let $el = $(this);
		$el.motionB();	
	});
	
	$(window).scroll(function(){
		$('[data-ani]:not(.fast)').each( function(i){		
			let $el = $(this);
			$el.motionA();
		});   
		
		$('[data-ani].fast').each( function(i){		
			let $el = $(this);
			$el.motionB();	
		});   
	});
}