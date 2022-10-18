import { useRecoilState } from 'recoil';
import { teamsState } from '../recoil/auth';

export default function TableCustomFieldteamSelector({ field, onUpdate }) {
  const [teams] = useRecoilState(teamsState);
  return (
    <div className="text-left">
      <div>
        <label style={{ marginBottom: 0 }}>
          <input
            type="checkbox"
            checked={field.enabled === true}
            onChange={(event) => {
              const checked = event.target.checked;
              onUpdate({ enabled: checked, enabledTeams: checked ? [] : teams.map((team) => team._id) });
            }}
          />{' '}
          Toute l'organisation
        </label>
      </div>
      {field.enabled === false &&
        teams.map((e) => {
          return (
            <div key={e._id}>
              <label style={{ marginBottom: 0 }}>
                <input
                  type="checkbox"
                  disabled={field.enabled === true}
                  checked={field.enabled === true || (field.enabledTeams || []).includes(e._id)}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    if (checked) {
                      onUpdate({
                        enabledTeams: [...new Set([...(field.enabledTeams || []), e._id])],
                      });
                    } else {
                      onUpdate({
                        enabledTeams: (field.enabledTeams || []).filter((f) => f !== e._id),
                      });
                    }
                  }}
                />{' '}
                {e.name}
              </label>
            </div>
          );
        })}
    </div>
  );
}
