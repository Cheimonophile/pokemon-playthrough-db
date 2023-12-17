import { FC, useEffect, useState } from "react";
import { Playthrough } from "../../types";
import { readPlaythroughs } from "../../backend/playthroughs";
import { message } from "@tauri-apps/api/dialog";



/**
 * Playthrough Dropdown
 */
export const PlaythroughInput: FC<{
    playthroughIdNo?: string,
    setPlaythroughIdNo?: (playthroughIdNo: string) => void
}> = (props) => {


    const [playthroughOptions, setPlaythroughOptions] = useState<Playthrough[]>()
    useEffect(() => {
        (async () => {
            try {
                const playthroughs = await readPlaythroughs({})
                setPlaythroughOptions(playthroughs)
                if (!props.playthroughIdNo) {
                    props.setPlaythroughIdNo?.(playthroughs[0].idNo)
                }
            }
            catch (error) {
                console.error(error)
                await message(`${error}`, {
                    title: 'Error Reading Playthroughs',
                    type: 'error',
                })
            }
        })()
    }, [])


    return (
        <div>
            <div>
                <label>Playthrough:</label>
            </div>
            <div>
                <select value={props.playthroughIdNo} onChange={e => props.setPlaythroughIdNo?.(e.target.value)}>
                    {playthroughOptions?.map((playthrough, i) => (
                        <option key={i} value={playthrough.idNo}>{playthrough.version} ({playthrough.adventureStarted.toISOString().slice(0, 10)})</option>
                    ))}
                </select>
            </div>
        </div>
    )
}