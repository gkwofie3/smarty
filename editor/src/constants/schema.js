export const ELEMENT_SCHEMA = {
    "elements": [
        {
            "name": "Line",
            "properties": [
                "start_x", "start_y", "end_x", "end_y", "stroke_color", "stroke_width", "stroke_style", "arrow_start", "arrow_end", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "animation_speed", "data_binding_source", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Rectangle",
            "properties": [
                "x_position", "y_position", "width", "height", "fill_color", "border_color", "border_width", "border_style", "corner_radius", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "shadow_color", "shadow_offset", "gradient_fill", "animation_type", "data_binding_source", "security_level", "audit_trail_enabled", "event_on_click", "event_on_hover"
            ]
        },
        {
            "name": "Pie Chart",
            "properties": [
                "x_position", "y_position", "width", "height", "chart_title", "chart_title_font_family", "chart_title_font_size", "chart_title_font_weight", "chart_title_color", "slices_list", "background_color", "border_color", "border_width", "visibility_condition", "enabled_condition", "z_index", "opacity", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Line Chart",
            "properties": [
                "x_position", "y_position", "width", "height", "chart_title", "chart_title_font_family", "chart_title_font_size", "chart_title_font_weight", "chart_title_color",
                "x_axis_label", "x_axis_label_font_family", "x_axis_label_font_size", "x_axis_label_font_weight", "x_axis_label_font_color",
                "y_axis_label", "y_axis_label_font_family", "y_axis_label_font_size", "y_axis_label_font_weight", "y_axis_label_font_color",
                "line_type", // spline, step, state
                "line_color", "line_width", "point_radius", "fill_area", "area_opacity",
                "y_axis_mode", "y_min", "y_max",
                "background_color", "border_color", "border_width", "axis_color", "axis_thickness", "tick_thickness",
                "points_list", // array of { label, value/point_id }
                "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Donut Chart",
            "properties": [
                "x_position", "y_position", "width", "height", "inner_radius", "chart_title", "chart_title_font_family", "chart_title_font_size", "chart_title_font_weight", "chart_title_color", "slices_list", "background_color", "border_color", "border_width", "visibility_condition", "enabled_condition", "z_index", "opacity", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Ellipse/Circle",
            "properties": [
                "x_position", "y_position", "width", "height", "fill_color", "border_color", "border_width", "border_style", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "shadow_color", "shadow_offset", "gradient_fill", "animation_type", "data_binding_source", "security_level", "audit_trail_enabled", "start_angle", "end_angle", "event_on_click"
            ]
        },
        {
            "name": "Polygon",
            "properties": [
                "points_list", "fill_color", "border_color", "border_width", "border_style", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "shadow_color", "shadow_offset", "gradient_fill", "animation_type", "data_binding_source", "security_level", "audit_trail_enabled", "event_on_click"
            ]
        },
        {
            "name": "Arc",
            "properties": [
                "x_position", "y_position", "width", "height", "start_angle", "end_angle", "stroke_color", "stroke_width", "stroke_style", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "animation_speed", "data_binding_source", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Static Text Label",
            "properties": [
                "x_position", "y_position", "width", "height", "text_content", "font_family", "font_size", "font_style", "font_color", "background_color", "alignment_horizontal", "alignment_vertical", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "shadow_color", "shadow_offset", "word_wrap", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Dynamic Text (Variable Text)",
            "properties": [
                "x_position", "y_position", "width", "height", "data_binding_source", "format_string", "font_family", "font_size", "font_style", "font_color", "background_color", "alignment_horizontal", "alignment_vertical", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "shadow_color", "shadow_offset", "word_wrap", "update_interval", "alarm_color_thresholds", "security_level", "audit_trail_enabled", "event_on_change"
            ]
        },
        {
            "name": "Static Image",
            "properties": [
                "x_position", "y_position", "width", "height", "image_source_url", "stretch_mode", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "border_color", "border_width", "shadow_color", "shadow_offset", "animation", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Animated Image",
            "properties": [
                "x_position", "y_position", "width", "height", "image_source_url", "animation_speed", "animation_binding_condition", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "border_color", "border_width", "shadow_color", "shadow_offset", "frame_count", "loop_enabled", "data_binding_source", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Increase Button",
            "properties": [
                "x_position", "y_position", "width", "height", "label_text", "font_family", "font_size", "font_weight", "font_color", "background_color", "background_color_hover", "background_color_active", "border_color", "border_width", "corner_radius", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "action_on_click", "action_on_press", "action_on_release", "target_element_id", "step_size", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Decrease Button",
            "properties": [
                "x_position", "y_position", "width", "height", "label_text", "font_family", "font_size", "font_weight", "font_color", "background_color", "background_color_hover", "background_color_active", "border_color", "border_width", "corner_radius", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "action_on_click", "action_on_press", "action_on_release", "target_element_id", "step_size", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Push Button",
            "properties": [
                "x_position", "y_position", "width", "height", "label_text", "font_family", "font_size", "font_weight", "font_color", "background_color", "background_color_hover", "background_color_active", "border_color", "border_width", "corner_radius", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "action_on_click", "action_on_press", "action_on_release", "toggle_mode", "image_icon", "security_level", "audit_trail_enabled", "confirmation_prompt", "navigation_target_page_id"
            ]
        },
        {
            "name": "Toggle Button/Switch",
            "properties": [
                "x_position", "y_position", "width", "height", "label_on", "label_off", "font_family", "font_size", "font_weight", "font_color_on", "font_color_off", "background_color_on", "background_color_off", "border_color", "border_width", "corner_radius", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "data_binding_source", "action_on_toggle", "image_on", "image_off", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Slider",
            "properties": [
                "x_position", "y_position", "width", "height", "orientation", "min_value", "max_value", "step_size", "default_value", "handle_color", "track_color", "fill_color", "handle_size", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "data_binding_source", "event_on_change", "tick_marks", "labels_enabled", "security_level", "audit_trail_enabled", "confirmation_required"
            ]
        },
        {
            "name": "Text Input",
            "properties": [
                "x_position", "y_position", "width", "height", "default_value", "placeholder_text", "font_family", "font_size", "font_weight", "font_color", "background_color", "border_color", "border_width", "corner_radius", "text_align", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "data_binding_source", "event_on_change", "security_level", "audit_trail_enabled", "read_only"
            ]
        },
        {
            "name": "Number Input",
            "properties": [
                "x_position", "y_position", "width", "height", "default_value", "min_value", "max_value", "step_size", "font_family", "font_size", "font_weight", "font_color", "background_color", "border_color", "border_width", "corner_radius", "text_align", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "data_binding_source", "event_on_change", "security_level", "audit_trail_enabled", "read_only", "show_spinner"
            ]
        },
        {
            "name": "Knob",
            "properties": [
                "x_position", "y_position", "width", "height", "min_value", "max_value", "step_size", "default_value", "knob_color", "dial_color", "pointer_length", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "data_binding_source", "event_on_change", "tick_marks", "labels_enabled", "arc_start_angle", "arc_end_angle", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Analog Gauge",
            "properties": [
                "x_position", "y_position", "width", "height", "min_value", "max_value", "major_ticks", "minor_ticks", "needle_color", "dial_color", "label_font", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "data_binding_source", "alarm_thresholds", "color_zones", "units_text", "precision", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Bar Gauge/Graph",
            "properties": [
                "x_position", "y_position", "width", "height", "orientation", "min_value", "max_value", "fill_color", "background_color", "border_color", "ticks_enabled", "labels_enabled", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "data_binding_source", "alarm_thresholds", "color_zones", "units_text", "precision", "multi_bar", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Bar Chart",
            "properties": [
                "x_position", "y_position", "width", "height", "chart_title", "chart_title_font_family", "chart_title_font_size", "chart_title_font_weight", "chart_title_color", "x_axis_label", "x_axis_label_font_family", "x_axis_label_font_size", "x_axis_label_font_weight", "x_axis_label_font_color", "y_axis_label", "y_axis_label_font_family", "y_axis_label_font_size", "y_axis_label_font_weight", "y_axis_label_font_color", "y_axis_mode", "y_min", "y_max", "y_axis_divisions", "bars_list", "axis_color", "axis_thickness", "tick_thickness", "background_color", "border_color", "border_width", "visibility_condition", "enabled_condition", "z_index", "opacity", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Trend Chart/Graph",
            "properties": [
                "x_position", "y_position", "width", "height", "data_sources", "x_axis_label", "y_axis_label", "min_y", "max_y", "time_range", "update_interval", "line_colors", "line_styles", "grid_enabled", "legend_enabled", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "zoom_enabled", "pan_enabled", "export_options", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Data Table",
            "properties": [
                "x_position", "y_position", "width", "height", "data_source", "columns", "row_height", "header_font", "cell_font", "cell_colors", "border_color", "border_width", "sortable_columns", "filterable", "pagination", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "update_interval", "export_options", "security_level", "audit_trail_enabled", "event_on_row_select"
            ]
        },
        {
            "name": "Alarm List/Table",
            "properties": [
                "x_position", "y_position", "width", "height", "alarm_source", "columns", "filter_by_severity", "sort_order", "acknowledge_button", "header_font", "cell_font", "color_by_severity", "border_color", "border_width", "pagination", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "update_interval", "audio_alert", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Indicator Light/LED",
            "properties": [
                "x_position", "y_position", "width", "height", "on_color", "off_color", "blink_on_alarm", "shape", "label_text", "font_family", "font_size", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "data_binding_source", "multi_state_colors", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Web View",
            "properties": [
                "x_position", "y_position", "width", "height", "url_source", "auto_refresh_interval", "zoom_level", "scrollbars_enabled", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "data_binding_url", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Video Player",
            "properties": [
                "x_position", "y_position", "width", "height", "video_source_url", "autoplay", "loop", "controls_visible", "volume", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "data_binding_source", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Symbol/Component",
            "properties": [
                "x_position", "y_position", "width", "height", "symbol_library_path", "instance_name", "data_bindings", "animation_conditions", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "event_handlers", "child_elements_properties", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Group",
            "properties": [
                "x_position", "y_position", "width", "height", "child_elements", "group_name", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "binding_inheritance", "event_propagation", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Hyperlink/Goto Tag",
            "properties": [
                "x_position", "y_position", "width", "height", "target_url_or_screen", "label_text", "font_family", "font_size", "font_color", "underline", "background_color", "border_color", "border_width", "corner_radius", "image_icon", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "open_in_new_window", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Snippet",
            "properties": [
                "x_position", "y_position", "snippet_library_path", "instance_parameters", "data_bindings", "visibility_condition", "enabled_condition", "z_index", "opacity", "name_id", "custom_metadata", "security_level", "audit_trail_enabled"
            ]
        },
        {
            "name": "Icon",
            "properties": [
                "x_position", "y_position", "width", "height", "size", "icon_set", "icon_name", "fill_color", "data_binding_source", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "shadow_color", "shadow_offset", "security_level", "audit_trail_enabled", "event_on_click"
            ]
        },
        {
            "name": "Vertical Gauge",
            "properties": [
                "x_position", "y_position", "width", "height", "min_value", "max_value", "current_value", "current_value_color", "font_size", "background_color", "border_color", "border_width", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "data_binding_source", "security_level", "audit_trail_enabled", "tick_marks", "labels_enabled", "pointer_color", "pointer_thickness", "gauge_color", "ranges", "range_color_mode"
            ]
        },
        {
            "name": "Horizontal Gauge",
            "properties": [
                "x_position", "y_position", "width", "height", "min_value", "max_value", "current_value", "current_value_color", "font_size", "background_color", "border_color", "border_width", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "data_binding_source", "security_level", "audit_trail_enabled", "tick_marks", "labels_enabled", "pointer_color", "pointer_thickness", "gauge_color", "ranges", "range_color_mode"
            ]
        },
        {
            "name": "Circular Gauge",
            "properties": [
                "x_position", "y_position", "width", "height", "min_value", "mid_value", "max_value", "current_value", "current_value_color", "font_size", "background_color", "border_color", "border_width", "start_angle", "sweep_angle", "rotation_angle", "visibility_condition", "enabled_condition", "z_index", "opacity", "tooltip_text", "name_id", "custom_metadata", "data_binding_source", "security_level", "audit_trail_enabled", "tick_marks", "labels_enabled", "min_thickness", "max_thickness", "pointer_color", "pointer_thickness", "custom_labels_list", "gauge_color", "ranges", "range_color_mode"
            ]
        }
    ]
};
