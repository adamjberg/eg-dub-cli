const { program } = require('commander');

program
  .name('eg')
  .description('CLI for remote deployments')
  .version('0.0.1')

program.command('deploy')
  .action(() => {
    console.log("deploy")
  })

program.parse();