import { FA_ICONS_1 } from './fa_part1';
import { FA_ICONS_2 } from './fa_part2';
import { MD_ICONS_1 } from './md_part1';
import { MD_ICONS_2 } from './md_part2';
import { MD_ICONS_3 } from './md_part3';
import { MD_ICONS_4 } from './md_part4';
import { BI_ICONS_1 } from './bi_part1';
import { BI_ICONS_2 } from './bi_part2';
import { BI_ICONS_3 } from './bi_part3';

export const ICON_LIST = {
    "Font Awesome": [
        ...FA_ICONS_1,
        ...FA_ICONS_2
    ].sort(),
    "Material Icons": [
        ...MD_ICONS_1,
        ...MD_ICONS_2,
        ...MD_ICONS_3,
        ...MD_ICONS_4
    ].sort(),
    "Bootstrap Icons": [
        ...BI_ICONS_1,
        ...BI_ICONS_2,
        ...BI_ICONS_3
    ].sort()
};
