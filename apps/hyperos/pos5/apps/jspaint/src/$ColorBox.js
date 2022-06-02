

function $Swatch(color){
	const $b = $(E("div")).addClass("swatch");
	const swatch_canvas = make_canvas();
	$(swatch_canvas).css({pointerEvents: "none"}).appendTo($b);
	
	$b.update = _color => {
		color = _color;
		if(color instanceof CanvasPattern){
			$b.addClass("pattern");
		}else{
			$b.removeClass("pattern");
		}
		
		requestAnimationFrame(() => {
			swatch_canvas.width = $b.innerWidth();
			swatch_canvas.height = $b.innerHeight();
			// I don't think disable_image_smoothing() is needed here
			
			if(color){
				swatch_canvas.ctx.fillStyle = color;
				swatch_canvas.ctx.fillRect(0, 0, swatch_canvas.width, swatch_canvas.height);
			}
		});
	};
	$G.on("theme-load", () => {
		$b.update(color);
	});
	$b.update(color);
	
	return $b;
}

function $ColorBox(){
	const $cb = $(E("div")).addClass("color-box");
	
	const $current_colors = $Swatch().addClass("current-colors");
	const $palette = $(E("div")).addClass("palette");
	
	$cb.append($current_colors, $palette);
	
	const $foreground_color = $Swatch().addClass("color-selection");
	const $background_color = $Swatch().addClass("color-selection");
	$current_colors.append($background_color, $foreground_color);
	
	$current_colors.css({
		position: "relative",
	});
	$foreground_color.css({
		position: "absolute",
		left: 2,
		top: 4,
	});
	$background_color.css({
		position: "absolute",
		right: 3,
		bottom: 3,
	});
	
	$G.on("option-changed", () => {
		$foreground_color.update(colors.foreground);
		$background_color.update(colors.background);
		$current_colors.update(colors.ternary);
	});
	
	$current_colors.on("pointerdown", () => {
		const new_bg = colors.foreground;
		colors.foreground = colors.background;
		colors.background = new_bg;
		$G.triggerHandler("option-changed");
	});
	
	// the one color editted by "Edit Colors..."
	let $last_fg_color_button;
	
	// TODO: base this on the element sizes
	const width_per_button = 16;
	
	function set_color(col){
		if(ctrl){
			colors.ternary = col;
		}else if(button === 0){
			colors.foreground = col;
		}else if(button === 2){
			colors.background = col;
		}
		$G.trigger("option-changed");
	}
	function color_to_hex(col){
		if(!col.match){ // i.e. CanvasPattern
			return "#000000";
		}
		const rgb_match = col.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		const rgb = rgb_match ? rgb_match.slice(1) : get_rgba_from_color(col).slice(0, 3);
		function hex(x){
			return (`0${parseInt(x).toString(16)}`).slice(-2);
		}
		return rgb ? (`#${hex(rgb[0])}${hex(rgb[1])}${hex(rgb[2])}`) : col;
	}
	
	const make_color_button = (color) => {

		const $b = $Swatch(color).addClass("color-button");
		$b.appendTo($palette);
		
		const $i = $(E("input")).attr({type: "color"});
		$i.appendTo($b);
		$i.on("change", () => {
			color = $i.val();
			$b.update(color);
			set_color(color);
		});
		
		$i.css("opacity", 0);
		$i.prop("enabled", false);
		
		$i.val(color_to_hex(color));
		
		$b.on("pointerdown", e => {
			// TODO: how should the ternary color, and selection cropping, work on macOS?
			ctrl = e.ctrlKey;
			button = e.button;
			if(button === 0){
				$last_fg_color_button = $b;
			}
			
			set_color(color);
			
			$i.val(color_to_hex(color));
			
			if(e.button === button && $i.prop("enabled")){
				$i.trigger("click", "synthetic");
			}
			
			$i.prop("enabled", true);
			setTimeout(() => {
				$i.prop("enabled", false);
			}, 400);
		});
		$i.on("click", (e, synthetic) => {
			if(!synthetic){
				e.preventDefault();
			}
		});
	};

	const build_palette = () => {
		$palette.empty();

		palette.forEach(make_color_button);

		$palette.width(Math.ceil(palette.length/2) * width_per_button);

		// the "last foreground color button" starts out as the first in the palette
		$last_fg_color_button = $palette.find(".color-button");
	};
	build_palette();
	
	const $c = $Component("Colors", "wide", $cb);
	
	$c.edit_last_color = () => {
		// Edit the last color cell that's been selected as the foreground color.
		create_and_trigger_input({type: "color"}, input => {
			// window.console && console.log(input, input.value);
			// FIXME
			$last_fg_color_button.trigger({type: "pointerdown", ctrlKey: false, button: 0});
			$last_fg_color_button.find("input").val(input.value).triggerHandler("change");
		})
		.show().css({width: 0, height: 0, padding: 0, border: 0, position: "absolute", pointerEvents: "none", overflow: "hidden"});
	};
	
	$c.rebuild_palette = build_palette;
	
	return $c;
}
