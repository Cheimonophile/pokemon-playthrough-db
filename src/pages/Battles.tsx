import { FC, Fragment, useCallback, useEffect, useState } from 'react'
import { createBattle, readBattles } from '../backend/battles'
import { flexGrow } from '../styles'
import { ask, message } from '@tauri-apps/api/dialog';
import { Battle, Playthrough, Trainer } from '../types';
import { readPlaythroughs } from '../backend/playthroughs';
import { readBattleTypes } from '../backend/battle_types';
import { readTrainerClasses } from '../backend/trainer_classes';
import { createTrainer, readTrainers } from '../backend/trainers';
import { invoke } from '@tauri-apps/api';
import { readRegions } from '../backend/regions';
import { createLocation, readLocations } from '../backend/locations';






export const Battles: FC<{}> = () => {

    // battle table state
    const [battles, setBattles] = useState<Battle[] | null>()

    // fetch battles
    useEffect(() => {
        const getBattles = async () => {
            try {
                const battles = await readBattles()
                setBattles(battles)
            }
            catch (error) {
                console.error(error)
                await message(`${error}`, {
                    title: 'Error',
                    type: 'error',
                })
                setBattles(null)
            }
        }
        getBattles()
        const interval = setInterval(getBattles, 250)
        return () => {
            clearInterval(interval)
        }
    }, [])


    return (
        <div style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            gap: '0.25rem',
            flexDirection: 'column'
        }}>
            <h1>Battles</h1>

            {/* Above Table */}
            <div style={{
                flex: 'none',
                display: 'flex',
                flexDirection: 'row',
                gap: '0.5rem',
            }}>
                {/* Make Battle */}
                <div>
                    <CreateBattle />
                </div>

                <div>
                    Levels
                </div>
            </div>

            {/* Battles Table */}
            <div style={{
                flex: flexGrow,
            }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    overflowY: 'auto',
                    padding: '0.25rem',
                    borderStyle: 'solid',
                }}>
                    <table className="border-separate border-spacing-x-2 border-spacing-y-1" style={{
                        borderCollapse: 'separate',
                        borderSpacing: '0.5rem 0.25rem',
                    }}>
                        <tbody>
                            {battles?.map((battle, i) => (
                                <Fragment key={i}>
                                    <BattleTableRow battle={battle} />
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}



const BattleTableRow: FC<{
    battle: Battle
}> = (props) => {

    // ui
    const [disabled, setDisabled] = useState<number>(0)

    // make battle title
    let title = `${props.battle.opponent1.class} ${props.battle.opponent1.name}`
    if (props.battle.opponent2) {
        title += ` and ${props.battle.opponent2.class}` + (props.battle.opponent2.name ? ` ${props.battle.opponent2.name}` : '')
    }
    if (props.battle.partner) {
        title += ` with ${props.battle.partner.class}` + (props.battle.partner.name ? ` ${props.battle.partner.name}` : '')
    }
    if (props.battle.lost) {
        title += " (lost)"
    }

    // delete battle
    const deleteBattle = useCallback(async () => {
        setDisabled(prev => prev + 1)
        try {
            const sure = await ask(`Are you sure you want to delete battle ${props.battle.no} against ${title}`, {
                title: 'Delete Battle?',
                type: 'info',
            })
            if (!sure) {
                setDisabled(prev => prev - 1)
                return
            }
            await invoke('delete_battle', { no: props.battle.no })
        }
        catch (error) {
            console.error(error)
            await message(`${error}`, {
                title: 'Error Deleting Battle',
                type: 'error',
            })
        }
        setDisabled(prev => prev - 1)
    }, [props.battle.no])

    return (<tr>
        <td>
            <button onClick={deleteBattle} disabled={disabled > 0}>X</button>
        </td>
        <td>
            {props.battle.no}.
        </td>
        <td>
            {title}
        </td>
        <td>
            {props.battle.location.name}
        </td>
        <td>
            {props.battle.location.region}
        </td>
    </tr>)
}



/**
 * Is the form to create a battle
 * 
 * @returns 
 */
const CreateBattle: FC<{}> = () => {


    // ui
    const [disabled, setDisabled] = useState<number>(0)


    // Playthroughs
    const [playthroughIdNo, setPlaythroughIdNo] = useState<string>("")
    const [playthroughOptions, setPlaythroughOptions] = useState<Playthrough[]>()
    useEffect(() => {
        (async () => {
            try {
                const playthroughs = await readPlaythroughs({})
                setPlaythroughOptions(playthroughs)
                setPlaythroughIdNo(playthroughs[0].idNo)
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

    // location
    const [location, setLocation] = useState<{ name: string, region: string }>({ name: "", region: "", })
    const [regionOptions, setRegionOptions] = useState<string[]>()
    useEffect(() => {
        (async () => {
            try {
                const regions = (await readRegions({})).reverse()
                setRegionOptions(regions)
                setLocation(prev => ({ ...prev, region: regions[0] }))
            }
            catch (error) {
                console.error(error)
                await message(`${error}`, {
                    title: 'Error Reading Regions',
                    type: 'error',
                })
            }
        })()
    }, [])
    const [locationValid, setLocationValid] = useState<boolean>(false)
    useEffect(() => {
        (async () => {
            try {
                const locations = await readLocations({ name: location.name, region: location.region })
                setLocationValid(locations.length > 0)
            }
            catch (error) {
                console.error(error)
                await message(`${error}`, {
                    title: 'Error Reading Locations',
                    type: 'error',
                })
            }
        })()
    }, [location])

    // battle type
    const [battleType, setBattleType] = useState<string>("")
    const [battleTypeOptions, setBattleTypeOptions] = useState<string[]>()
    useEffect(() => {
        (async () => {
            try {
                const battleTypes = await readBattleTypes({})
                setBattleTypeOptions(battleTypes)
                setBattleType(battleTypes[0])
            }
            catch (error) {
                console.error(error)
                await message(`${error}`, {
                    title: 'Error Reading Battle Types',
                    type: 'error',
                })
            }
        })()
    }, [])


    // opponent 1
    const [opponent1, setOpponent1] = useState<Trainer>({ name: "", class: "", })
    const [opponent1Validity, setOpponent1Validity] = useState<{ name: boolean, class: boolean }>({ name: false, class: false })
    useEffect(() => {
        // trainer classes
        (async () => {
            try {
                const trainerClasses = await readTrainerClasses({ name: opponent1.class })
                setOpponent1Validity(prev => ({ ...prev, class: trainerClasses.length > 0 }))
            }
            catch (error) {
                console.error(error)
                await message(`${error}`, {
                    title: 'Error Reading Trainer Classes',
                    type: 'error',
                })
            }
        })();
        // trainers
        (async () => {
            try {
                const trainers = await readTrainers({ name: opponent1.name, class: opponent1.class })
                setOpponent1Validity(prev => ({ ...prev, name: trainers.length > 0 }))
            }
            catch (error) {
                console.error(error)
                await message(`${error}`, {
                    title: 'Error Reading Trainers',
                    type: 'error',
                })
            }
        })();
    }, [opponent1])

    // opponent 2
    const [opponent2, setOpponent2] = useState<Trainer>({ name: "", class: "", })
    const [useOpponent2, setUseOpponent2] = useState<boolean>(false)
    const [opponent2Validity, setOpponent2Validity] = useState<{ name: boolean, class: boolean }>({ name: false, class: false })
    useEffect(() => {
        // trainer classes
        (async () => {
            try {
                const trainerClasses = await readTrainerClasses({ name: opponent2.class })
                setOpponent2Validity(prev => ({ ...prev, class: trainerClasses.length > 0 }))
            }
            catch (error) {
                console.error(error)
                await message(`${error}`, {
                    title: 'Error Reading Trainer Classes',
                    type: 'error',
                })
            }
        })();
        // trainers
        (async () => {
            try {
                const trainers = await readTrainers({ name: opponent2.name, class: opponent2.class })
                setOpponent2Validity(prev => ({ ...prev, name: trainers.length > 0 }))
            }
            catch (error) {
                console.error(error)
                await message(`${error}`, {
                    title: 'Error Reading Trainers',
                    type: 'error',
                })
            }
        })();
    }, [opponent2])

    // partner
    const [partner, setPartner] = useState<Trainer>({ name: "", class: "", })
    const [usePartner, setUsePartner] = useState<boolean>(false)
    const [partnerValidity, setPartnerValidity] = useState<{ name: boolean, class: boolean }>({ name: false, class: false })
    useEffect(() => {
        // trainer classes
        (async () => {
            try {
                const trainerClasses = await readTrainerClasses({ name: partner.class })
                setPartnerValidity(prev => ({ ...prev, class: trainerClasses.length > 0 }))
            }
            catch (error) {
                console.error(error)
                await message(`${error}`, {
                    title: 'Error Reading Trainer Classes',
                    type: 'error',
                })
            }
        })();
        // trainers
        (async () => {
            try {
                const trainers = await readTrainers({ name: partner.name, class: partner.class })
                setPartnerValidity(prev => ({ ...prev, name: trainers.length > 0 }))
            }
            catch (error) {
                console.error(error)
                await message(`${error}`, {
                    title: 'Error Reading Trainers',
                    type: 'error',
                })
            }
        })();
    }, [partner])

    // round
    const [round, setRound] = useState<number>(0)

    // lost
    const [lost, setLost] = useState<boolean>(false)

    // create battle button
    const createBattleOnClick = async () => {
        setDisabled(prev => prev + 1)
        try {
            // location
            await tryCreateLocation(locationValid, setLocationValid, location)
            // opponent 1
            await tryCreateTrainer(opponent1Validity, setOpponent1Validity, opponent1)
            // opponent 2
            if (useOpponent2) {
                await tryCreateTrainer(opponent2Validity, setOpponent2Validity, opponent2)
            }
            // partner
            if (usePartner) {
                await tryCreateTrainer(partnerValidity, setPartnerValidity, partner)
            }
            // create the battle
            await createBattle({
                playthroughIdNo: playthroughIdNo,
                locationName: location.name,
                locationRegion: location.region,
                battleType: battleType,
                opponent1Class: opponent1.class,
                opponent1Name: opponent1.name,
                opponent2Class: useOpponent2 ? opponent2.class : undefined,
                opponent2Name: useOpponent2 ? opponent2.name : undefined,
                partnerClass: usePartner ? partner.class : undefined,
                partnerName: usePartner ? partner.name : undefined,
                round: round,
                lost: lost,
            })
            setBattleType(battleTypeOptions?.at(0) ?? "Single")
            setOpponent1({ name: "", class: "", })
            setUseOpponent2(false)
            setOpponent2({ name: "", class: "", })
            setUsePartner(false)
            setPartner({ name: "", class: "", })
            setLost(false)
        }
        catch (error) {
            console.error(error)
            await message(`${error}`, {
                title: 'Error Creating Battle',
                type: 'error',
            })
        }
        setDisabled(prev => prev - 1)
    }

    return (
        <div>
            {/* Playthrough selector */}
            <div>
                <label>Playthrough:</label>
                <select value={playthroughIdNo} onChange={e => setPlaythroughIdNo(e.target.value)}>
                    {playthroughOptions?.map((playthrough, i) => (
                        <option key={i} value={playthrough.idNo}>{playthrough.version} ({playthrough.adventureStarted.toISOString().slice(0, 10)})</option>
                    ))}
                </select>
            </div>

            {/* Location */}
            <div>
                <label>Location:</label>
                <select value={location.region} onChange={e => setLocation(prev => ({ ...prev, region: e.target.value }))}>
                    {regionOptions?.map((region, i) => (
                        <option key={i} value={region}>{region}</option>
                    ))}
                </select>
                <input
                    type="text"
                    style={{
                        color: locationValid ? undefined : 'red',
                    }}
                    value={location.name}
                    onChange={e => setLocation(prev => ({ ...prev, name: e.target.value }))}
                />
            </div>

            {/* Battle Type */}
            <div>
                <label>Battle Type:</label>
                <select value={battleType} onChange={e => setBattleType(e.target.value)}>
                    {battleTypeOptions?.map((battleType, i) => (
                        <option key={i} value={battleType}>{battleType}</option>
                    ))}
                </select>
            </div>

            {/* Opponent 1 */}
            <div>
                <label>Opponent 1:</label>
                <input
                    type="text"
                    style={{
                        color: opponent1Validity.class ? undefined : 'red',
                    }}
                    value={opponent1.class}
                    onChange={e => setOpponent1(prev => ({ ...prev, class: e.target.value }))}
                />
                <input
                    type="text"
                    style={{
                        color: opponent1Validity.name ? undefined : 'red',
                    }}
                    value={opponent1.name}
                    onChange={e => setOpponent1(prev => ({ ...prev, name: e.target.value }))}
                />
            </div>


            {/* Opponent 2 */}
            <div>
                <label>Opponent 2:</label>
                <input
                    type="checkbox"
                    checked={useOpponent2}
                    onChange={e => setUseOpponent2(prev => !prev)}
                />
                {useOpponent2 && (<>
                    <input
                        type="text"
                        style={{
                            color: opponent2Validity.class ? undefined : 'red',
                        }}
                        value={opponent2.class}
                        onChange={e => setOpponent2(prev => ({ ...prev, class: e.target.value }))}
                    />
                    <input
                        type="text"
                        style={{
                            color: opponent2Validity.name ? undefined : 'red',
                        }}
                        value={opponent2.name}
                        onChange={e => setOpponent2(prev => ({ ...prev, name: e.target.value }))}
                    />
                </>)}
            </div>

            {/* Partner */}
            <div>
                <label>Partner:</label>
                <input
                    type="checkbox"
                    checked={usePartner}
                    onChange={e => setUsePartner(prev => !prev)}
                />
                {usePartner && (<>
                    <input
                        type="text"
                        style={{
                            color: partnerValidity.class ? undefined : 'red',
                        }}
                        value={partner.class}
                        onChange={e => setPartner(prev => ({ ...prev, class: e.target.value }))}
                    />
                    <input
                        type="text"
                        style={{
                            color: partnerValidity.name ? undefined : 'red',
                        }}
                        value={partner.name}
                        onChange={e => setPartner(prev => ({ ...prev, name: e.target.value }))}
                    />
                </>)}
            </div>

            {/* Round */}
            <div>
                <label>Round:</label>
                <input
                    type="number"
                    style={{
                        color: isNaN(round) ? 'red' : undefined,
                    }}
                    value={round}
                    onChange={e => setRound(parseInt(e.target.value))}
                />
            </div>

            {/* Lost */}
            <div>
                <label>Lost:</label>
                <input
                    type="checkbox"
                    checked={lost}
                    onChange={e => setLost(e.target.checked)}
                />
            </div>

            {/* Add Button */}
            <div>
                <button
                    onClick={createBattleOnClick}
                    disabled={disabled > 0}>
                    Create Battle
                </button>
            </div>
        </div>
    )
}



const tryCreateTrainer = async (
    validity: { name: boolean, class: boolean },
    setValidity: React.Dispatch<React.SetStateAction<{
        name: boolean;
        class: boolean;
    }>>,
    trainer: Trainer,
) => {
    if (!validity.class) {
        if (trainer.class.length < 1)
            throw new Error("Blank trainer class")
        const doCreateNewTrainerClass = await ask(`'${trainer.class}' does not exist. Create it?`, {
            title: 'Create Trainer Class?',
            type: 'info',
        })
        if (!doCreateNewTrainerClass)
            throw new Error("Trainer Class does not exist")
        await invoke('create_trainer_class', { name: trainer.class })
        setValidity(prev => ({ ...prev, class: true }))
    }
    if (!validity.name) {
        if (trainer.name.length < 1)
            throw new Error("Blank trainer name")
        const doCreateNewTrainer = await ask(`'${trainer.class} ${trainer.name}' does not exist. Create them?`, {
            title: 'Create Trainer?',
            type: 'info',
        })
        if (!doCreateNewTrainer)
            throw new Error("Trainer does not exist")
        await createTrainer({ name: trainer.name, class: trainer.class })
        setValidity(prev => ({ ...prev, name: true }))
    }
}


const tryCreateLocation = async (
    locationValid: boolean,
    setLocationValid: React.Dispatch<React.SetStateAction<boolean>>,
    location: { name: string, region: string },
) => {
    if (!locationValid) {
        if (location.name.length < 1)
            throw new Error("Blank location name")
        const doCreateNewLocation = await ask(`'${location.name}, ${location.region}' does not exist. Create it?`, {
            title: 'Create Location?',
            type: 'info',
        })
        if (!doCreateNewLocation)
            throw new Error("Location does not exist")
        await createLocation(location)
        setLocationValid(true)
    }
}