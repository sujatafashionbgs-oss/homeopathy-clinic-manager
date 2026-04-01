import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Set "mo:core/Set";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // User Profile Type
  public type UserProfile = {
    name : Text;
    role : Text; // e.g., "Doctor", "Receptionist", "Admin"
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  // User Profile Functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Types

  type Gender = {
    #male;
    #female;
    #other;
  };

  type PaymentStatus = {
    #paid;
    #pending;
  };

  public type Patient = {
    id : Nat;
    name : Text;
    patientCode : Text;
    age : Nat;
    gender : Gender;
    phone : Text;
    address : Text;
    state : Text;
    chiefComplaints : Text;
    medicalHistory : Text;
    isActive : Bool;
  };

  public type Visit = {
    id : Nat;
    patientId : Nat;
    visitDate : Time.Time;
    chiefComplaint : Text;
    diagnosis : Text;
    prescription : Text;
    followUpDate : ?Time.Time;
    notes : Text;
    isActive : Bool;
  };

  public type Medicine = {
    id : Nat;
    name : Text;
    category : Text;
    potency : Text;
    quantity : Nat;
    minStockLevel : Nat;
    unitPrice : Nat;
    isActive : Bool;
  };

  public type Bill = {
    id : Nat;
    billNumber : Text;
    patientId : Nat;
    billDate : Time.Time;
    items : Text;
    totalAmount : Nat;
    paidAmount : Nat;
    paymentStatus : PaymentStatus;
    isActive : Bool;
  };

  public type ClinicSettings = {
    clinicName : Text;
    doctorName : Text;
    qualification : Text;
    address : Text;
    phone : Text;
  };

  // Comparison Modules

  module Patient {
    public func compare(p1 : Patient, p2 : Patient) : Order.Order {
      if (p1.id < p2.id) { #less } else if (p1.id > p2.id) { #greater } else { #equal };
    };
  };

  module Medicine {
    public func compare(m1 : Medicine, m2 : Medicine) : Order.Order {
      Text.compare(m1.name, m2.name);
    };
  };

  module Bill {
    public func compare(b1 : Bill, b2 : Bill) : Order.Order {
      if (b1.id < b2.id) { #less } else if (b1.id > b2.id) { #greater } else { #equal };
    };
  };

  // Data Stores

  let patients = Map.empty<Nat, Patient>();
  var nextPatientId = 1;

  let visits = Map.empty<Nat, Visit>();
  var nextVisitId = 1;

  let medicines = Map.empty<Nat, Medicine>();
  var nextMedicineId = 1;

  let bills = Map.empty<Nat, Bill>();
  var nextBillId = 1;

  var clinicSettings : ClinicSettings = {
    clinicName = "HomeoClinic";
    doctorName = "Dr. John Doe";
    qualification = "BHMS";
    address = "123 Main Street";
    phone = "1234567890";
  };

  // Helper Functions

  func formatPatientCode(id : Nat) : Text {
    var idText = id.toText();
    var zerosNeeded = 5 - idText.size();
    var zeros = "";
    while (zerosNeeded > 0) {
      zeros #= "0";
      zerosNeeded -= 1;
    };
    "HC-" # zeros # idText;
  };

  func formatBillNumber(id : Nat) : Text {
    let year = "2026";
    var idText = id.toText();
    var zerosNeeded = 5 - idText.size();
    var zeros = "";
    while (zerosNeeded > 0) {
      zeros #= "0";
      zerosNeeded -= 1;
    };
    "INV-" # year # "-" # zeros # idText;
  };

  func getPatientInternal(id : Nat) : Patient {
    switch (patients.get(id)) {
      case (null) { Runtime.trap("Patient not found") };
      case (?patient) {
        if (not patient.isActive) { Runtime.trap("Patient not found") };
        patient;
      };
    };
  };

  func getMedicineInternal(id : Nat) : Medicine {
    switch (medicines.get(id)) {
      case (null) { Runtime.trap("Medicine not found") };
      case (?medicine) {
        if (not medicine.isActive) { Runtime.trap("Medicine not found") };
        medicine;
      };
    };
  };

  func getBillInternal(id : Nat) : Bill {
    switch (bills.get(id)) {
      case (null) { Runtime.trap("Bill not found") };
      case (?bill) {
        if (not bill.isActive) { Runtime.trap("Bill not found") };
        bill;
      };
    };
  };

  // Authorization Checks

  public type CreatorToken = Nat;
  let validCreatorTokens = Set.empty<CreatorToken>();
  let inviteTokenMap = Map.empty<Principal, CreatorToken>();

  // Patient Functions

  public shared ({ caller }) func addPatient(patient : Patient) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add patients");
    };
    let id = nextPatientId;
    nextPatientId += 1;
    let newPatient : Patient = {
      patient with
      id;
      patientCode = formatPatientCode(id);
      isActive = true;
    };
    patients.add(id, newPatient);
    id;
  };

  public shared ({ caller }) func updatePatient(id : Nat, patient : Patient) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update patients");
    };
    ignore getPatientInternal(id); // Check existence
    let updatedPatient : Patient = {
      patient with
      id;
      patientCode = formatPatientCode(id);
      isActive = true;
    };
    patients.add(id, updatedPatient);
  };

  public shared ({ caller }) func deletePatient(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete patients");
    };
    let patient = getPatientInternal(id);
    let updatedPatient = { patient with isActive = false };
    patients.add(id, updatedPatient);
  };

  public query ({ caller }) func getPatient(id : Nat) : async Patient {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view patient details");
    };
    getPatientInternal(id);
  };

  public query ({ caller }) func searchPatients(searchTerm : Text) : async [Patient] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search patients");
    };
    patients.values().toArray().filter(
      func(p) {
        p.isActive and (
          p.name.toLower().contains(#text (searchTerm.toLower())) or
          searchTerm.toLower().contains(#text (p.name.toLower())) or
          p.phone.toLower().contains(#text (searchTerm.toLower())) or
          searchTerm.toLower().contains(#text (p.phone.toLower()))
        );
      }
    );
  };

  // Visit Functions

  public shared ({ caller }) func addVisit(visit : Visit) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add visits");
    };
    ignore getPatientInternal(visit.patientId); // Check patient existence
    let id = nextVisitId;
    nextVisitId += 1;
    let newVisit : Visit = {
      visit with
      id;
      isActive = true;
    };
    visits.add(id, newVisit);
    id;
  };

  public shared ({ caller }) func updateVisit(id : Nat, visit : Visit) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update visits");
    };
    ignore getPatientInternal(visit.patientId); // Check patient existence
    let current = switch (visits.get(id)) {
      case (null) { Runtime.trap("Visit not found") };
      case (?v) { v };
    };
    if (not current.isActive) { Runtime.trap("Visit not found") };
    let updatedVisit : Visit = {
      visit with
      id;
      isActive = true;
    };
    visits.add(id, updatedVisit);
  };

  public shared ({ caller }) func deleteVisit(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete visits");
    };
    let current = switch (visits.get(id)) {
      case (null) { Runtime.trap("Visit not found") };
      case (?v) { v };
    };
    if (not current.isActive) { Runtime.trap("Visit not found") };
    let updatedVisit = { current with isActive = false };
    visits.add(id, updatedVisit);
  };

  public query ({ caller }) func getVisitsByPatient(patientId : Nat) : async [Visit] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view visits");
    };
    visits.values().toArray().filter(
      func(v) { v.patientId == patientId and v.isActive }
    );
  };

  // Medicine Functions

  public shared ({ caller }) func addMedicine(medicine : Medicine) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add medicines");
    };
    let id = nextMedicineId;
    nextMedicineId += 1;
    let newMedicine : Medicine = {
      medicine with
      id;
      isActive = true;
    };
    medicines.add(id, newMedicine);
    id;
  };

  public shared ({ caller }) func updateMedicine(id : Nat, medicine : Medicine) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update medicines");
    };
    ignore getMedicineInternal(id); // Check existence
    let updatedMedicine : Medicine = {
      medicine with
      id;
      isActive = true;
    };
    medicines.add(id, updatedMedicine);
  };

  public shared ({ caller }) func deleteMedicine(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete medicines");
    };
    let medicine = getMedicineInternal(id);
    let updatedMedicine = { medicine with isActive = false };
    medicines.add(id, updatedMedicine);
  };

  public query ({ caller }) func getMedicine(id : Nat) : async Medicine {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view medicine details");
    };
    getMedicineInternal(id);
  };

  public query ({ caller }) func getLowStockMedicines() : async [Medicine] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view medicine stock");
    };
    medicines.values().toArray().filter(
      func(m) { m.isActive and m.quantity <= m.minStockLevel }
    ).sort();
  };

  // Bill Functions

  public shared ({ caller }) func addBill(bill : Bill) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add bills");
    };
    ignore getPatientInternal(bill.patientId); // Check patient existence
    let id = nextBillId;
    nextBillId += 1;
    let newBill : Bill = {
      bill with
      id;
      billNumber = formatBillNumber(id);
      isActive = true;
    };
    bills.add(id, newBill);
    id;
  };

  public shared ({ caller }) func updateBill(id : Nat, bill : Bill) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update bills");
    };
    ignore getPatientInternal(bill.patientId); // Check patient existence
    let current = switch (bills.get(id)) {
      case (null) { Runtime.trap("Bill not found") };
      case (?b) { b };
    };
    if (not current.isActive) { Runtime.trap("Bill not found") };
    let updatedBill : Bill = {
      bill with
      id;
      billNumber = formatBillNumber(id);
      isActive = true;
    };
    bills.add(id, updatedBill);
  };

  public shared ({ caller }) func deleteBill(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete bills");
    };
    let bill = getBillInternal(id);
    let updatedBill = { bill with isActive = false };
    bills.add(id, updatedBill);
  };

  public query ({ caller }) func getBillsByPatient(patientId : Nat) : async [Bill] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bills");
    };
    bills.values().toArray().filter(
      func(b) { b.patientId == patientId and b.isActive }
    ).sort();
  };

  // Clinic Settings

  public query ({ caller }) func getClinicSettings() : async ClinicSettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view clinic settings");
    };
    clinicSettings;
  };

  public shared ({ caller }) func updateClinicSettings(settings : ClinicSettings) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update clinic settings");
    };
    clinicSettings := settings;
  };

  // Init Sample Data

  public shared ({ caller }) func initSampleData() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can initialize sample data");
    };
    // Patients
    let p1Id = nextPatientId;
    nextPatientId += 1;
    patients.add(
      p1Id,
      {
        id = p1Id;
        name = "Alice Johnson";
        patientCode = formatPatientCode(p1Id);
        age = 30;
        gender = #female;
        phone = "111-111-1111";
        address = "123 Main St";
        state = "California";
        chiefComplaints = "Headache";
        medicalHistory = "None";
        isActive = true;
      },
    );

    let p2Id = nextPatientId;
    nextPatientId += 1;
    patients.add(
      p2Id,
      {
        id = p2Id;
        name = "Bob Smith";
        patientCode = formatPatientCode(p2Id);
        age = 45;
        gender = #male;
        phone = "222-222-2222";
        address = "456 Maple Ave";
        state = "Texas";
        chiefComplaints = "Back Pain";
        medicalHistory = "Diabetes";
        isActive = true;
      },
    );

    let p3Id = nextPatientId;
    nextPatientId += 1;
    patients.add(
      p3Id,
      {
        id = p3Id;
        name = "Carol White";
        patientCode = formatPatientCode(p3Id);
        age = 28;
        gender = #female;
        phone = "333-333-3333";
        address = "789 Oak Blvd";
        state = "New York";
        chiefComplaints = "Anxiety";
        medicalHistory = "None";
        isActive = true;
      },
    );

    // Medicines
    for ((name, category, potency, quantity) in [
      ("Arnica", "Pain Relief", "30C", 50),
      ("Belladonna", "Fever", "200C", 30),
      ("Nux Vomica", "Digestive", "30C", 40),
      ("Pulsatilla", "Colds & Flu", "200C", 20),
      ("Bryonia", "Cough", "30C", 35),
    ].values()) {
      let mId = nextMedicineId;
      nextMedicineId += 1;
      medicines.add(
        mId,
        {
          id = mId;
          name;
          category;
          potency;
          quantity;
          minStockLevel = 10;
          unitPrice = 100;
          isActive = true;
        },
      );
    };

    // Visits
    let v1Id = nextVisitId;
    nextVisitId += 1;
    visits.add(
      v1Id,
      {
        id = v1Id;
        patientId = p1Id;
        visitDate = Time.now();
        chiefComplaint = "Headache";
        diagnosis = "Migraine";
        prescription = "Arnica 30C";
        followUpDate = null;
        notes = "Improving";
        isActive = true;
      },
    );

    let v2Id = nextVisitId;
    nextVisitId += 1;
    visits.add(
      v2Id,
      {
        id = v2Id;
        patientId = p2Id;
        visitDate = Time.now();
        chiefComplaint = "Back Pain";
        diagnosis = "Lumbar strain";
        prescription = "Bryonia 30C";
        followUpDate = null;
        notes = "Rest recommended";
        isActive = true;
      },
    );

    // Bills
    let b1Id = nextBillId;
    nextBillId += 1;
    bills.add(
      b1Id,
      {
        id = b1Id;
        billNumber = formatBillNumber(b1Id);
        patientId = p1Id;
        billDate = Time.now();
        items = "Consultation - 500";
        totalAmount = 500;
        paidAmount = 500;
        paymentStatus = #paid;
        isActive = true;
      },
    );
  };
};
