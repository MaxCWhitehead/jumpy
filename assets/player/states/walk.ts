type PlayerState = { id: string; age: u64; previous_state: string };
const PlayerState: BevyType<PlayerState> = {
  typeName: "jumpy::player::state::PlayerState",
};

type HandlePlayerMeta = HandleImage;
type PlayerControl = {
  move_direction: Vec2;
  jump_pressed: boolean;
  jump_just_pressed: boolean;
  shoot_pressed: boolean;
  shoot_just_pressed: boolean;
  grab_pressed: boolean;
  grab_just_pressed: boolean;
  slide_pressed: boolean;
  slide_just_pressed: boolean;
};
type PlayerInput = {
  active: boolean;
  selected_player: HandlePlayerMeta;
  control: PlayerControl;
  previous_control: PlayerControl;
};
type PlayerInputs = {
  players: PlayerInput[];
};
const PlayerInputs: BevyType<PlayerInputs> = {
  typeName: "jumpy::player::input::PlayerInputs",
};

type KinematicBody = {
  offset: Vec2;
  size: Vec2;
  velocity: Vec2;
  is_on_ground: boolean;
  was_on_ground: boolean;
  has_mass: boolean;
  has_friction: boolean;
  bouncyness: f32;
  is_deactivated: boolean;
  gravity: f32;
};
const KinematicBody: BevyType<KinematicBody> = {
  typeName: "jumpy::physics::KinematicBody",
};

type PlayerIdx = [usize];
const PlayerIdx: BevyType<PlayerIdx> = {
  typeName: "jumpy::player::PlayerIdx",
};

type AnimationBankSprite = {
  current_animation: string;
  flip_x: boolean;
  flip_y: boolean;
  animations: unknown;
};
const AnimationBankSprite: BevyType<AnimationBankSprite> = {
  typeName: "jumpy::animation::AnimationBankSprite",
};

const scriptId = ScriptInfo.get().path;

export default {
  playerStateTransition() {
    const player_inputs = world.resource(PlayerInputs);
    const playerComponents = world
      .query(PlayerState, PlayerIdx, KinematicBody)
      .map((x) => x.components);

    for (const [playerState, playerIdx, body] of playerComponents) {
      if (playerState.id != scriptId) continue;

      const control = player_inputs.players[playerIdx[0]].control;

      if (!body.is_on_ground) {
        playerState.id = Assets.getAbsolutePath("./midair.ts");
      } else if (body.is_on_ground && control.move_direction.y < -0.5) {
        playerState.id = Assets.getAbsolutePath("./crouch.ts");
      } else if (control.move_direction.x == 0) {
        playerState.id = Assets.getAbsolutePath("./idle.ts");
      }
    }
  },
  handlePlayerState() {
    const player_inputs = world.resource(PlayerInputs);

    // For every player
    const playerComponents = world
      .query(PlayerState, PlayerIdx, AnimationBankSprite, KinematicBody)
      .map((x) => x.components);
    for (const [
      playerState,
      playerIdx,
      animationBankSprite,
      body,
    ] of playerComponents) {
      // In this state
      if (playerState.id != scriptId) continue;

      // Set the current animation
      if (playerState.age == 0) {
        animationBankSprite.current_animation = "walk";
      }

      // Add basic physics controls
      const control = player_inputs.players[playerIdx[0]].control;

      // Add jump
      if (control.jump_just_pressed) {
        body.velocity.y = 15;
      }
      body.velocity.x = control.move_direction.x * 5;
      if (control.move_direction.x > 0) {
        animationBankSprite.flip_x = false;
      } else if (control.move_direction.x < 0) {
        animationBankSprite.flip_x = true;
      }
    }
  },
};
