
import './App.css'
import "@mantine/core/styles.css"
import "@mantine/charts/styles.css"
import 'mantine-datatable/styles.layer.css';
import '@mantine/dates/styles.css';
import BirdMapContainer from './components/BirdMapContainer';
import AppShellLayout from './components/AppShell';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import { useHash } from '@mantine/hooks';
import DataViewMigration from './components/DataViewMigration';
import { Toaster } from 'react-hot-toast'
function App() {

  const [hash, setHash] = useHash();


  return (
    <>
      <MantineProvider>
        <AppShellLayout hash={hash} setHash={setHash}>
          <div>
            {hash.replace("#", "") == "map" && <BirdMapContainer />}
            {hash.replace("#", "") == "data" && <DataViewMigration />}

            <div>

            </div>
          </div>

          <Toaster
            position="top-center"
            reverseOrder={false}
          />
        </AppShellLayout>
      </MantineProvider>
    </>
  )

}
export default App
