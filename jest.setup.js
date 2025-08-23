import jestChrome from 'jest-chrome'

// eslint-disable-next-line no-undef
Object.assign(global, jestChrome)
// eslint-disable-next-line no-undef
global.console.trace = (..._args) => {}