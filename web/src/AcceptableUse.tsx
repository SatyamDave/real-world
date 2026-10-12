// The copy of product/acceptable-use.md, word for word. Change both together.
const SETTINGS = "https://github.com/SatyamDave/real-world/blob/main/engine/rw/settings.py";

export function AcceptableUse() {
  return (
    <article className="card policy" aria-labelledby="aup">
      <h1 id="aup">Acceptable use</h1>
      <p>
        Real World simulates groups of synthetic people and publishes scored forecasts. It is not a
        tool for testing political messages or for imitating real people. These rules apply to every
        fork, in the web app and through <code>POST /v1/simulate</code>.
      </p>

      <h2>The rules</h2>
      <ol className="rules">
        <li>
          <strong>No persuasion testing on elections or candidates.</strong> Do not use a fork to
          find which message, ad, slogan or framing moves voters, or how to shift support for a
          candidate, party or ballot measure.
        </li>
        <li>
          <strong>No real private people.</strong> Do not name, describe or imitate a real private
          individual in an event. Agents are sampled from a synthetic population calibrated to
          published marginals; none of them is a real person.
        </li>
        <li>
          <strong>Outputs are labelled simulated.</strong> Every result says{" "}
          <code>simulated: true</code> and carries a disclosure. Do not remove the label when you
          quote, share or republish a result.
        </li>
      </ol>

      <h2>Election window</h2>
      <p>
        From 2026-10-27 to 2026-11-04 (UTC, both days included), around the US midterm elections on
        2026-11-03, a fork event that names a party, candidate or ballot measure is refused, even
        when it is not persuasion testing. The dates are <code>ELECTION_WINDOW</code> in{" "}
        <a href={SETTINGS}>engine/rw/settings.py</a>.
      </p>

      <h2>What happens to a fork that breaks a rule</h2>
      <p>
        The fork does not start. A refusal from the rule pass costs nothing; one from the
        classification costs only that one call. The API answers <code>422</code> with a stable{" "}
        <code>code</code> and a plain <code>detail</code>; the web app shows the detail under the
        event box.
      </p>
      <table>
        <thead>
          <tr>
            <th>
              <code>code</code>
            </th>
            <th>Rule</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="mono">private_person</td>
            <td>No real private people</td>
          </tr>
          <tr>
            <td className="mono">election_persuasion</td>
            <td>No persuasion testing on elections or candidates</td>
          </tr>
          <tr>
            <td className="mono">election_window</td>
            <td>Election window</td>
          </tr>
        </tbody>
      </table>
      <p>
        The check runs a fixed rule pass and then one short model classification of the event text.
        If the classification cannot run, the API answers <code>503</code> and starts nothing. A
        refused request writes no job.
      </p>
    </article>
  );
}
