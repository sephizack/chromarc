'use strict';

import { SidePanel } from "../components/SidePanel.js";
import { h, NanoReact } from "../nanoreact.js";

document.getElementsByTagName("body")[0].appendChild(NanoReact.render(h(SidePanel)));
