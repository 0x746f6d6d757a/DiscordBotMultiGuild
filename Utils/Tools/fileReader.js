import { glob } from 'glob'
import path from 'path'

export async function loadFiles(dirName) {
    try {
        const files = await glob(path.join(process.cwd(), dirName, "**/*.js").replace(/\\/g, "/"))
        const jsFiles = files.filter(file => path.extname(file) === ".js")
        return jsFiles
    } catch (error) {
        console.error(`Error while loading files from directory ${dirName}: ${error}`)
        throw error
    }
}