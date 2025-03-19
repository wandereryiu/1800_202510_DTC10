module.exports = {
    theme: {
        extend: {
            fontFamily: {
                playwrite: ["Playwrite IT Moderna", ...defaultTheme.fontFamily.sans]
            }
        }
    }
}

export default {
    plugins: {
        "@tailwindcss/postcss": {},
    }
}