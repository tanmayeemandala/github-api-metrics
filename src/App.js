import { useState } from "react";
import { useTable } from "react-table";
import { columns } from "./constants";
import "./App.css";

export default function App() {
  const [orgRepoName, setRepoName] = useState('');
  const [saved, setSaved] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [repoMetaData, setAllRepoMetaData] = useState([]);
  const [repoMetrics, setRepoMetrics] = useState({
    forksCount: 0,
    starsCount: 0,
    watchersCount: 0,
    commitsCount: 0,
    branchesCount: 0,
    contributorsCount: 0,
    openPRCount: 0,
    clonesCount: 0,
    uniqueClonesCount: 0,
    visitorsCount: 0,
    uniqueVisitorsCount: 0,
    subscribersCount: 0,
    totalIssuesCount: 0,
    repositoryName: "",
    repositoryDescription: "",
    contributionsCount: 0,
  });

  const headers = {
    headers: {
      Authorization: "token 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"
    }
  }

  const getSingleRepo = async (selectedOption) => {
    let orgName = "capitalone";
    if (saved) {
      orgName = orgRepoName
    }
    const repoName =
      selectedOption !== null ? selectedOption : "acronym-decoder";
    const searchQueryURL = `https://api.github.com/repos/${orgName}/${repoName}`;
    const commitsURL = `https://api.github.com/repos/${orgName}/${repoName}/commits`;
    const branchesURL = `https://api.github.com/repos/${orgName}/${repoName}/branches`;
    const openPullRequestsURL = `https://api.github.com/repos/${orgName}/${repoName}/pulls`;
    const totalContributorsURL = `https://api.github.com/repos/${orgName}/${repoName}/contributors`;
    const clonesCountURL = `https://api.github.com/repos/${orgName}/${repoName}/traffic/clones`;
    const visitorsCountURL = `https://api.github.com/repos/${orgName}/${repoName}/traffic/views`;

    return await fetch(searchQueryURL, headers)
      .then((result) => result.json())
      .then(async (response) => {
        console.log("Checking", response);
        const commits_count = await fetch(commitsURL, headers).then((commitRes) =>
            commitRes.json()
        );
        const branches_count = await fetch(branchesURL, headers).then((branchesRes) =>
          branchesRes.json()
        );
        const open_pulls = await fetch(openPullRequestsURL, headers).then(
          (openPullRes) => openPullRes.json()
        );
        const contributors_count = await fetch(totalContributorsURL, headers)
          .then((response) => response.json())
          .then((totalContributorsCount) => {
            const contributors = totalContributorsCount || [];
            return {
              totalCount: contributors?.length,
              totalContributionsCount: contributors?.reduce((acc, curr) => {
                return acc + curr.contributions;
              }, 0),
            };
          });

        const clones_count = await fetch(clonesCountURL, headers).then(
          (response) => response.json()
        ).then(clones => ({
          count: clones.count,
          unique: clones.uniques
        }));

        const visitors_count = await fetch(visitorsCountURL, headers).then(
          (response) => response.json()
        ).then(visitors => ({
          count: visitors.count,
          unique: visitors.uniques
        }));

    const {
      name,
      watchers_count,
      subscribers_count,
      stargazers_count,
      open_issues,
      forks_count,
    } = response;
    setRepoMetrics((prevState) => ({
      ...prevState,
      repositoryDescription: response.description,
      repositoryName: name,
      forksCount: forks_count,
      starsCount: stargazers_count,
      watchersCount: watchers_count,
      totalIssuesCount: open_issues,
      commitsCount: commits_count?.length,
      branchesCount: branches_count?.length,
      contributorsCount: contributors_count?.totalCount,
      contributionsCount: contributors_count?.totalContributionsCount,
      openPRCount: open_pulls?.length,
      clonesCount: clones_count.count,
      uniqueClonesCount: clones_count.unique,
      visitorsCount: visitors_count.count,
      uniqueVisitorsCount: visitors_count.unique,
      subscribersCount: subscribers_count,
    }));
  })
      .catch ((err) => console.log(err));
};

const getAllRepos = async (searchKey) => {
  let orgName = "capitalone";
  if (saved) {
    orgName = orgRepoName
  }
  const searchQueryURL = `https://api.github.com/orgs/${orgName}/repos`;
  return await fetch(searchQueryURL, headers)
    .then((result) => result.json())
    .then((response) => {
      if (searchKey === "") {
        return [];
      } else {
        return response.filter((repo) =>
          repo.name.toLowerCase().includes(searchKey.toLowerCase())
        );
      }
    })
    .then((result) => setAllRepoMetaData(result))
    .catch((err) => console.log(err));
};

const debounceFunction = (func, delay) => {
  let timer;
  return function () {
    let self = this;
    let args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(self, args)
    }, delay)
  }
}

const handleSelectedOption = (optionName) => {
  setSelectedOption(optionName);
  setSearchName(optionName);
  getSingleRepo(optionName);
};

const handleSearchNameChange = (e) => {
  const searchText = e.target.value;
  setSearchName(searchText);
  const inputSearchDebounceFunc = debounceFunction(getAllRepos, 2000);
  inputSearchDebounceFunc(searchText);
};

const handleSaveOrgName = (event) => {
  console.log(orgRepoName);
  event.preventDefault()
  setSaved(true);
}

const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
  useTable({ columns, data: [repoMetrics] });

return (
  <div>
    <div className="search-box">
      <label>Enter project name to get metrics : </label>
      <input
        placeholder="Enter project name...."
        type="text"
        onChange={(event) =>{ 
          setRepoName(event.target.value);
          setSaved(false);
        }}
        value={orgRepoName}
      />
      <button disabled={saved} onClick={(event) => handleSaveOrgName(event)}>Save</button>
    </div>
    <div className="search-box">
      <label>Enter repository name to get metrics : </label>
      <input
        placeholder="Search Repository...."
        type="text"
        onChange={(event) => handleSearchNameChange(event)}
        value={searchName}
      />
      <span>Example: acronym-decoder</span>
    </div>
    <SearchSuggestions
      repos={repoMetaData}
      optionSelect={handleSelectedOption}
    />
    {selectedOption !== "" && (
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>
                  {column.render("Header")}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map((cell) => {
                  return (
                    <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </div>
);
}

const SearchSuggestions = ({ repos, optionSelect }) => {
  const handleOptionClick = (option) => {
    optionSelect(option?.name);
  };
  const options = repos.map((repo, id) => (
    <li key={id} onClick={() => handleOptionClick(repo)}>
      {repo.name}
    </li>
  ));
  return <ul>{options}</ul>;
};
