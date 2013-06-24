import pandas as pd
import re
from collections import namedtuple
import numpy as np

countline = re.compile("^\s*(\d+) (\S+)\s*")
Person = namedtuple('Person', 'work email data')

def get_people(dataframe):
    for i, row in dataframe.iterrows():
        topcommands = row["What are your top 100 unix commands?"]
        if pd.isnull(topcommands):
            continue
        lines = topcommands.split("\n")
        matching_lines = [line for line in lines if countline.match(line) is not None]
        if len(matching_lines) == 0:
            #print "Skipping"
            continue
        countdata = pd.DataFrame([countline.match(line).groups() for line in matching_lines], columns = ['count', 'command'])
        countdata['count'] = np.vectorize(np.int)(countdata['count'])
        if len(set(countdata['command'])) != len(countdata['command']):
            # Add up all the counts for the same command
            countdata = countdata.groupby('command').aggregate('sum').reset_index()
        countdata['normalized_count'] = countdata['count'] / float(sum(countdata['count']))
        countdata['num_people_using'] = 1
        countdata = countdata[countdata['command'] != 'historynsed']
        yield Person(row["What kind of work do you do? (optional)"], row["What is your email address? (optional)"], countdata)


def command_summary(people):
    everyone = pd.concat([p.data for p in people])
    g = everyone.groupby('command')
    cmds = g.aggregate(sum).sort('num_people_using', ascending=False)
    cmds['usage_frequency'] = cmds['count'] / cmds['num_people_using']
    return cmds


def command_usage_vectors(cmds, people):
    usage_vectors = pd.DataFrame(columns=np.arange(len(people)), index=cmds[cmds.num_people_using > 1].index)
    usage_vectors.fillna(0, inplace=True)
    for i, person in enumerate(people):
        to_set = person.data[person.data['command'].isin(usage_vectors.index)]['command']
        usage_vectors[i].ix[to_set] = 1

def compute_correlations(usage_vectors, num_commands=50):
  def get_corr(a, b):
      return usage_vectors[a].corr(usage_vectors[b])
  common_columns = usage_vectors.columns[:50]
  return pd.DataFrame([
      (i, j, get_corr(i, j)) 
      for i in common_columns 
      for j in common_columns 
        if i < j
    ], 
    columns = ['one', 'two', 'correlation'])

def get_connected_components(correlations):
    together_things = []
    for _, row in correlations.iterrows():
        command1, command2, correlation = row.values
        for thingset in together_things:
            if command1 in thingset or command2 in thingset:
                thingset.add(command1)
                thingset.add(command2)
                break
        else:
            together_things.append(set([command1, command2]))
    return together_things

def correlation_graph(correlations):
    nodes_to_graph = correlations[correlations['correlation'] > 0.45]
    command_list = list(set(list(nodes_to_graph.one.unique()) + list(nodes_to_graph.two.unique())))
    command_indices = {name: idx for idx, name in enumerate(command_list)}
    connected_components = get_connected_components(nodes_to_graph)
    component_indices = {cmd: idx for idx, commands in enumerate(connected_components) for cmd in commands}
    def make_dict(row):
        return {
            "source": command_indices[row['one']], 
            "target": command_indices[row['two']], 
            "value": row['correlation']}
    nodes = [{'name': cmd, "group": component_indices[cmd]} for cmd in command_list]
    links = [ make_dict(row) for _, row in nodes_to_graph.iterrows()]
    return {
        "nodes": nodes,
        "links": links
    }
