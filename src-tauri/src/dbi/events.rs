use diesel::prelude::*;
use diesel::SqliteConnection;

use crate::schema;

use crate::dbi::structs::*;

use super::structs::location::Location;
use super::structs::playthrough::Playthrough;

pub fn create_playthrough(
    conn: &mut SqliteConnection,
    id_no: &str,
    name: &str,
    version: &str,
    adventure_started: &str,
) -> Playthrough {
    let new_playthrough = playthrough::InsertPlaythrough {
        id_no,
        name,
        version,
        adventure_started,
    };
    diesel::insert_into(schema::Playthrough::table)
        .values(&new_playthrough)
        .execute(conn)
        .expect("Error saving new playthrough");
    let playthrough = schema::Playthrough::table
        .filter(schema::Playthrough::id_no.eq(id_no))
        .first::<Playthrough>(conn)
        .expect("Error loading playthrough");
    println!("Created playthrough {}", playthrough);
    playthrough
}

pub fn create_location(conn: &mut SqliteConnection, name: &str, region: &str) -> Location {
    let new_location = location::InsertLocation { name, region };
    diesel::insert_into(schema::Location::table)
        .values(&new_location)
        .execute(conn)
        .expect("Error saving new location");
    let location = schema::Location::table
        .filter(schema::Location::name.eq(name).and(schema::Location::region.eq(region)))
        .first::<crate::dbi::structs::location::Location>(conn)
        .expect("Error loading location");
    println!("Created location {}", location);
    location
}

pub fn create_species(
    conn: &mut SqliteConnection,
    name: &str,
    dex_no: &i32,
    generation: &i32,
    type1: &str,
    type2: Option<&str>,
) -> species::Species {
    let new_species = species::InsertSpecies {
        name,
        dex_no,
        generation,
        type1,
        type2,
    };
    diesel::insert_into(schema::Species::table)
        .values(&new_species)
        .execute(conn)
        .expect("Error saving new species");
    let species = schema::Species::table
        .filter(schema::Species::name.eq(name))
        .first::<crate::dbi::structs::species::Species>(conn)
        .expect("Error loading species");
    println!("Created species {}", species);
    species
}

pub fn catch_pokemon(
    conn: &mut SqliteConnection,
    playthrough: &playthrough::Playthrough,
    slot: &i32,
    species: &species::Species,
    nickname: Option<&str>,
    catch_type: &str,
    caught_date: &str,
    caught_location: &location::Location,
    caught_level: &i32,
    gender: &str,
    ball: &str,
) -> team_member::TeamMember {
    let new_event = event::InsertEvent {
        playthrough_id_no: &playthrough.id_no,
        location_name: &caught_location.name,
        location_region: &caught_location.region,
    };
    diesel::insert_into(schema::Event::table)
        .values(&new_event)
        .execute(conn)
        .expect("Error saving new event");
    let event = schema::Event::table
        .filter(schema::Event::playthrough_id_no.eq(&playthrough.id_no))
        .order(schema::Event::no.desc())
        .first::<event::Event>(conn)
        .expect("Error loading event");
    let new_catch_event = catch_event::InsertCatchEvent {
        no: &event.no,
        catch_type: catch_type,
    };
    diesel::insert_into(schema::Catch_Event::table)
        .values(&new_catch_event)
        .execute(conn)
        .expect("Error saving new catch event");
    let new_team_member = team_member::InsertTeamMember {
        playthrough_id_no: &playthrough.id_no,
        slot,
        nickname,
        caught_date,
        caught_location_name: &caught_location.name,
        caught_location_region: &caught_location.region,
        caught_species_name: &species.name,
        caught_level,
        gender,
        ball,
    };
    diesel::insert_into(schema::Team_Member::table)
        .values(&new_team_member)
        .execute(conn)
        .expect("Error saving new team member");
    let new_team_member_change = team_member_change::InsertTeamMemberChange {
        team_member_playthrough_id_no: &playthrough.id_no,
        team_member_slot: slot,
        event_no: &event.no,
        level: Some(caught_level),
        species_name: Some(&species.name),
    };
    diesel::insert_into(schema::Team_Member_Change::table)
        .values(&new_team_member_change)
        .execute(conn)
        .expect("Error saving new team member change");
    let team_member = schema::Team_Member::table
        .filter(
            schema::Team_Member::playthrough_id_no
                .eq(&playthrough.id_no)
                .and(schema::Team_Member::slot.eq(slot)),
        )
        .first::<team_member::TeamMember>(conn)
        .expect("Error loading team member");
    println!("Got {} ({})", species, catch_type);
    team_member
}

pub fn create_trainer_class(
    conn: &mut SqliteConnection,
    name: &str,
) -> trainer_class::TrainerClass {
    let new_trainer_class = trainer_class::InsertTrainerClass { name };
    diesel::insert_into(schema::Trainer_Class::table)
        .values(&new_trainer_class)
        .execute(conn)
        .expect("Error saving new trainer class");
    let trainer_class = schema::Trainer_Class::table
        .filter(schema::Trainer_Class::name.eq(name))
        .first::<crate::dbi::structs::trainer_class::TrainerClass>(conn)
        .expect("Error loading trainer class");
    println!("Created trainer class {}", trainer_class);
    trainer_class
}

pub fn create_trainer(
    conn: &mut SqliteConnection,
    name: &str,
    class: &trainer_class::TrainerClass,
) -> trainer::Trainer {
    let new_trainer = trainer::InsertTrainer {
        name,
        class: &class.name,
    };
    diesel::insert_into(schema::Trainer::table)
        .values(&new_trainer)
        .execute(conn)
        .expect("Error saving new trainer");
    let trainer = schema::Trainer::table
        .filter(schema::Trainer::class.eq(&class.name).and(schema::Trainer::name.eq(&name)))
        .first::<crate::dbi::structs::trainer::Trainer>(conn)
        .expect("Error loading trainer");
    println!("Created trainer {}", trainer.format(conn));
    trainer
}

pub fn create_battle(
    conn: &mut SqliteConnection,
    playthrough: &playthrough::Playthrough,
    location: &location::Location,
    opponent1: &trainer::Trainer,
    opponent2: Option<&trainer::Trainer>,
    partner: Option<&trainer::Trainer>,
    battle_type: &str,
    round: &i32,
    lost: &bool,
) -> event::Event {
    let new_event = event::InsertEvent {
        playthrough_id_no: &playthrough.id_no,
        location_name: &location.name,
        location_region: &location.region,
    };
    diesel::insert_into(schema::Event::table)
        .values(&new_event)
        .execute(conn)
        .expect("Error saving new event");
    let event = schema::Event::table
        .filter(schema::Event::playthrough_id_no.eq(&playthrough.id_no))
        .order(schema::Event::no.desc())
        .first::<event::Event>(conn)
        .expect("Error loading event");
    let new_battle_event = battle_event::InsertBattleEvent {
        no: &event.no,
        battle_type,
        opponent1_name: &opponent1.name,
        opponent1_class: &opponent1.class,
        opponent2_name: opponent2.and_then(|o| Some(o.name.as_ref())),
        opponent2_class: opponent2.and_then(|o| Some(o.class.as_ref())),
        partner_name: partner.and_then(|p| Some(p.name.as_ref())),
        partner_class: partner.and_then(|p| Some(p.class.as_ref())),
        round,
        lost,
    };
    diesel::insert_into(schema::Battle_Event::table)
        .values(&new_battle_event)
        .execute(conn)
        .expect("Error saving new battle event");
    let mut display = format!("Battled {}", opponent1.format(conn));
    if let Some(trainer) = opponent2 {
        display.push_str(&format!(" and {}", trainer.format(conn)));
    }
    if let Some(trainer) = partner {
        display.push_str(&format!(" with {}", trainer.format(conn)));
    }
    if *lost {
        display.push_str(" (lost)");
    }
    println!("{}", display);
    event
}

pub fn level_up(
    conn: &mut SqliteConnection,
    battle: &event::Event,
    team_member: &team_member::TeamMember,
    level: &i32,
) {
    let new_team_member_change = team_member_change::InsertTeamMemberChange {
        team_member_playthrough_id_no: &team_member.playthrough_id_no,
        team_member_slot: &team_member.slot,
        event_no: &battle.no,
        level: Some(level),
        species_name: None,
    };
    diesel::insert_into(schema::Team_Member_Change::table)
        .values(&new_team_member_change)
        .execute(conn)
        .expect("Error saving new team member change");
    println!("{} leveled up to {}", team_member.format(conn), level);
}


pub fn create_item(
    conn: &mut SqliteConnection,
    name: &str,
) -> item::Item {
    let new_item = item::InsertItem {
        name,
    };
    diesel::insert_into(schema::Item::table)
        .values(&new_item)
        .execute(conn)
        .expect("Error saving new item");
    let item = schema::Item::table
        .filter(schema::Item::name.eq(name))
        .first::<crate::dbi::structs::item::Item>(conn)
        .expect("Error loading item");
    println!("Created item {}", item);
    item
}


pub fn use_item(
    conn: &mut SqliteConnection,
    event: &event::Event,
    item: &item::Item,
) -> event::Event {
    let event = event::InsertEvent {
        playthrough_id_no: &event.playthrough_id_no,
        location_name: &event.location_name,
        location_region: &event.location_region,
    };
    diesel::insert_into(schema::Event::table)
        .values(&event)
        .execute(conn)
        .expect("Error saving new event");
    let event = schema::Event::table
        .filter(schema::Event::playthrough_id_no.eq(&event.playthrough_id_no))
        .order(schema::Event::no.desc())
        .first::<event::Event>(conn)
        .expect("Error loading event");
    let new_item_event = item_event::InsertItemEvent {
        no: &event.no,
        item: &item.name,
    };
    println!("Used {}", item);
    return event
}


pub fn evolve(
    conn: &mut SqliteConnection,
    event: &event::Event,
    team_member: &team_member::TeamMember,
    species: &species::Species,
) {
    let new_team_member_change = team_member_change::InsertTeamMemberChange {
        team_member_playthrough_id_no: &team_member.playthrough_id_no,
        team_member_slot: &team_member.slot,
        event_no: &event.no,
        level: None,
        species_name: Some(&species.name),
    };
    diesel::insert_into(schema::Team_Member_Change::table)
        .values(&new_team_member_change)
        .execute(conn)
        .expect("Error saving new team member change");
    println!("{} evolved into {}", team_member.format(conn), species);
}