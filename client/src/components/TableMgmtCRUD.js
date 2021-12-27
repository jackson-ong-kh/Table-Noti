import React, {useState, useEffect, useRef} from "react";
import io from 'socket.io-client'
import useDeepCompareEffect from 'use-deep-compare-effect'
import {
    Row,
    Col,
    Navbar,
    NavbarBrand,
    Button
} from "reactstrap"

import Modal from 'react-bootstrap/Modal';
import 'bootstrap/dist/css/bootstrap.min.css';
import Table from "./Table"


export default props => {
    const socketRef = useRef()
    const formRef = useRef()

    const backEndDomain = process.env.REACT_APP_BACK_END_DOMAIN
    const defaultTable = {
        table: {
            name: null,
            id: null,
        }
    }

    const [totalTables, setTotalTables] = useState([])
    const [oneTableToEdit, setOneTableToEdit] = useState([])

    const oneTable = async () => {
        await totalTables.forEach((obj, index) => {
            if (obj.tableNumber === selection.table.name) {
                const result = [obj.tableNumber, obj.capacity, obj.status]
                setOneTableToEdit(result)
            }
        })
    }

    // prompts for modals
    const [addTableSuccessful, setAddTableSuccessful] = useState(false)
    const [editTable, setEditTable] = useState(false)
    const [deleteTable, setDeleteTable] = useState(false)
    const [duplicatedTable, setDuplicatedTable] = useState(false)

    // User's selections
    const [selection, setSelection] = useState(defaultTable)

    // Handle User Logout

    const handleClickLogout = () => {
        if (localStorage.getItem('token')) {
            localStorage.removeItem('token');
            props.setPage(0)
        }
    }

    const getEmptyTables = _ => { // let tables = totalTables.filter(table => table.isAvailable);
        let tables = totalTables
        let count = 0
        tables.forEach(_ => _.status === "unoccupied" && count++)
        return count;
    };

    const apiCallFunction = async _ => {
        let res = await fetch(`${backEndDomain}/availability/findall`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${
                    localStorage.getItem('token')
                }`
            }
        });
        res = await res.json();
        setTotalTables(res);
        // console.log(totalTables)
    }

    // check table availability

    useDeepCompareEffect(() => {
        socketRef.current = io.connect(backEndDomain)
        socketRef.current.on("apiCall", ({apiCall}) => {
            apiCallFunction()
        })
        apiCallFunction()
        return() => socketRef.current.disconnect()
    }, [totalTables]);

    // Clicking on a table sets the selection state
    const selectTable = (table_name, table_id) => {
        setSelection({
            ...selection,
            table: {
                name: table_name,
                id: table_id
            }
        });
    };

    const [editTableState, setEditTableState] = useState(0)

    // for add function
    const [addTableNumber, setAddTableNumber] = useState(0)
    const [tableCapacityChange, setTableCapacityChange] = useState(0)

    // for update function
    const [updateTableNumber, setUpdateTableNumber] = useState(0)
    const [updateTableCapacity, setUpdateTableCapacity] = useState(0)
    const [updateTableStatus, setUpdateTableStatus] = useState("")

    const addTableNumberChange = (e) => {
        setAddTableNumber(e.target.value);
    }

    const addTableCapacityChange = (e) => {
        setTableCapacityChange(e.target.value);
    }

    const handleAddTable = async (e) => {
        e.preventDefault()
        let res = await fetch(`${backEndDomain}/availability/createone`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${
                    localStorage.getItem('token')
                }`
            },
            body: JSON.stringify(
                {tableNumber: addTableNumber, capacity: tableCapacityChange}
            )
        });
        if (res.ok) {
            res = await res.json()
            setAddTableSuccessful(true)
            formRef.current.reset()
        } else {
            console.log(res.error)
            setDuplicatedTable(true)
        }

     }

    const handleEditTableClose = async (e) => {
        setEditTable(false)
        setOneTableToEdit([])
    }

    const handleUpdateTableNumber = (e) => {
        setUpdateTableNumber(e.target.value);
    }

    const handleUpdateTableCapacity = (e) => {
        setUpdateTableCapacity(e.target.value);
    }

    const handleUpdateTableStatus = (e) => {
        setUpdateTableStatus(e.target.value);
    }

    const handleUpdateTable = async (e) => {
        if (editTableState === 1 || editTableState === 3) return 
        e.preventDefault()
        let res = await fetch(`${backEndDomain}/availability/updateone`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${
                    localStorage.getItem('token')
                }`
            },
            body: JSON.stringify(
                {tableNumber: selection.table.name, newTableNumber: updateTableNumber, capacity: updateTableCapacity, status: updateTableStatus}
            )
        });
        if (res.ok) {
            res = await res.json()
            setEditTable(false)
            setOneTableToEdit([])
            formRef.current.reset()
        } else {
            setDuplicatedTable(true) 
            console.log(res.json())
        }

    }

    const handleDeleteTable = async (e) => {
        e.preventDefault()
        let res = await fetch(`${backEndDomain}/availability/deleteone`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${
                    localStorage.getItem('token')
                }`
            },
            body: JSON.stringify(
                {
                    tableNumber: selection.table.name
                }
            )
        });
        res = await res.json()
        setDeleteTable(false)
        setSelection(defaultTable)
    }

    // Generating tables from available tables state
    const getTables = _ => {
        if (getEmptyTables() > 0) {
            let tables = [];
            totalTables.forEach(table => {
                if (table.status === "unoccupied") {
                    tables.push (
                        <Table key={
                                table._id
                            }
                            id={
                                table._id
                            }
                            chairs={
                                table.capacity
                            }
                            name={
                                table.tableNumber
                            }
                            empty
                            selectTable={selectTable}/>
                    );
                } else if (table.status === "awaiting party") {
                    tables.push (
                        <Table key={
                                table._id
                            }
                            id={
                                table._id
                            }
                            chairs={
                                table.capacity
                            }
                            name={
                                table.tableNumber
                            }
                            awaiting
                            selectTable={selectTable}/>
                    )
                } else {
                    tables.push (
                        <Table key={
                                table._id
                            }
                            id={
                                table._id
                            }
                            chairs={
                                table.capacity
                            }
                            name={
                                table.tableNumber
                            }
                            selectTable={selectTable}/>
                    );
                }
            });
            return tables;
        }
    }

    useEffect(() => {
        setUpdateTableNumber(0)
        setUpdateTableCapacity(0)
        setUpdateTableStatus('')
    }, [editTable])

    useEffect(() => {
        oneTable()
        editTableState === 3 && selection.table.id && setDeleteTable(true)
        if (editTableState === 2 && selection.table.id) {
            setEditTable(true)
            // TO VERIFY
            setUpdateTableNumber(oneTableToEdit[0])
            setUpdateTableCapacity(oneTableToEdit[1])
            setUpdateTableStatus(oneTableToEdit[2])
        }

    }, [selection])




    // notifications

    return (
        <div>
            <NavbarBrand className="nav-brand mx-auto">
                BK Sushi Place - Table Management
            </NavbarBrand>

            <Row noGutters className="text-center align-items-center">

                <Navbar color="light" light expand="md"></Navbar>
                <Col xs="12" sm="3">
                    <Button color="none" className="button-general toggle-menu"
                        onClick={
                            () => props.setPage(1)
                        }
                        setPage={
                            props.setPage
                    }>
                        Reservation Menu
                    </Button>
                </Col>
                <Col xs="12" sm="3">
                    <Button color="none" className="button-general"
                        onClick={handleClickLogout}>
                        Logout
                    </Button>
                </Col>
            </Row>

            <Row noGutters className="text-center align-items-center">
                <Navbar color="light" light expand="md"></Navbar>

                <Col xs="12" sm="3">
                    <Button color="none" className="button-general add-table" onClick= {() => setEditTableState(1)}>
                        Add Table
                    </Button>
                </Col>
                <Col xs="12" sm="3">
                    <Button color="none" className="button-general edit-table"
                        onClick={
                            () => setEditTableState(2)
                    }>
                        Edit Table
                    </Button>
                </Col>
                <Col xs="12" sm="3">
                    <Button color="none" className="button-general"
                        onClick={
                            () => setEditTableState(3)
                        }
                        setPage={
                            props.setPage
                    }>
                        Delete Table
                    </Button>
                </Col>

            </Row>

            <div> {
                editTableState === 1 && <div>
                    <Row noGutters className="text-center">
                        <Col>
                            <form ref={formRef}>
                                <h2 cl>Fill in table details</h2>
                                <label for="tableNumber">Table Number</label>
                                <input type="text" name="tableNumber"
                                    onChange={addTableNumberChange}/>
                                <br/>
                                <label for="capacity">Capacity</label>
                                <input type="text" name="capacity"
                                    onChange={addTableCapacityChange}/>
                                <br/>
                                <Button color="none" className="book-table-btn"
                                    onClick={handleAddTable}>
                                    Add table
                                </Button>
                            </form>
                        </Col>
                    </Row>

                    <Modal show={addTableSuccessful}
                        onHide={
                            () => setAddTableSuccessful(false)
                    }>
                        <Modal.Header closeButton>
                            <Modal.Title>Add table successful</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>You have successfully added table.</Modal.Body>
                        <Modal.Footer>
                            <Button variant="primary"
                                onClick={
                                    () => setAddTableSuccessful(false)
                            }>
                                Ok
                            </Button>
                        </Modal.Footer>
                    </Modal>

                </div>
            } </div>


            {
            (editTableState === 2 || editTableState === 3) && <>
                <div>
                    <Row noGutters className="display-tables">
                        <Col> {
                            getEmptyTables() > 0 ? (
                                <p className="available-tables">
                                    {
                                    `Select tables to 
                                  ${
                                        editTableState === 2 ? 'edit' : 'delete'
                                    }`
                                } </p>
                            ) : null
                        }

                            {
                            getEmptyTables() > 0 ? (
                                <div>
                                    <div className="table-legend">
                                        <span className="occupied-table"></span>
                                        &nbsp; Unoccupied
                                                                                                                                                                                                                            &nbsp;&nbsp;
                                        <span className="awaiting-table"></span>
                                        &nbsp; Awaiting party
                                                                                                                                                                                                                            &nbsp;&nbsp;
                                        <span className="unoccupied-table"></span>
                                        &nbsp; Occupied
                                                                                                                                                                                                                            &nbsp;&nbsp;
                                    </div>
                                    <Row noGutters>
                                        {
                                        getTables()
                                    }</Row>
                                </div>
                            ) : (
                                <p className="table-display-message">No Available Tables</p>
                            )
                        } </Col>
                    </Row>
                </div>


                <Modal show={deleteTable}
                    onHide={
                        () => setDeleteTable(false)
                }>
                    <Modal.Header closeButton>
                        <Modal.Title>Confirm delete table?</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{
                        `Are you sure you want to delete table ${
                            selection.table.name
                        }?`
                    }</Modal.Body>
                    <Modal.Footer>
                        <Button variant="primary"
                            onClick={handleDeleteTable}>
                            Yes
                        </Button>
                        <Button variant="secondary"
                            onClick={
                                () => setDeleteTable(false)
                        }>
                            Cancel
                        </Button>
                    </Modal.Footer>
                </Modal>
            </>
        }

        
            <div>
                <Modal show={editTable}
                    onHide={handleEditTableClose}>
                    <Modal.Header closeButton>
                        <Modal.Title>Edit table information</Modal.Title>
                    </Modal.Header>
                    <form ref={formRef}>
                        <h2>Edit details of existing table {selection.table.name} below </h2>
                        <label for="tableNumber">Table Number</label>
                        <input type="number" name="tableNumber" defaultValue={oneTableToEdit[0]}
                            required onChange={handleUpdateTableNumber}/>
                        <br/>
                        <label for="capacity">Capacity</label>
                        <input type="number" name="capacity" defaultValue={oneTableToEdit[1]}
                            required onChange={handleUpdateTableCapacity}/>
                        <br/>
                        <label for="status">Status</label>
                        <select name="status" required onChange={handleUpdateTableStatus} defaultValue={oneTableToEdit[2]}>
                            <option value="unoccupied">Unoccupied</option>
                            <option value="awaiting party">Awaiting Party</option>
                            <option value="occupied">Occupied</option>
                        </select>

                        <br/>
                    </form>

                    <Modal.Footer>
                        <Button variant="primary"
                            onClick={handleUpdateTable}>
                            Ok
                        </Button>
                        <Button variant="secondary"
                            onClick={handleEditTableClose}>
                            Cancel
                        </Button>
                    </Modal.Footer>
                </Modal>

                <Modal show={duplicatedTable}
                        onHide={
                            () => setDuplicatedTable(false)
                    }>
                        <Modal.Header closeButton>
                            <Modal.Title>Table already existed. </Modal.Title>
                        </Modal.Header>
                        <Modal.Body>You have keyed in an existing table number. Please choose a different one.</Modal.Body>
                        <Modal.Footer>
                            <Button variant="primary"
                                onClick={
                                    () => setDuplicatedTable(false)
                            }>
                                Ok
                            </Button>
                        </Modal.Footer>
                    </Modal>

            </div>


        </div>
    );
};